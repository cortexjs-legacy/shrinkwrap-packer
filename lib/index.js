'use strict';

module.exports = Packer;

var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var archiver = require('archiver');
var async = require('async');
var _ = require('underscore');
var glob = require('glob');
var md5json = require('md5-json');
var shrinked = require('shrinked');
var semver = require('semver');
var temp = require('temp');
var md5 = require('./md5');
var checksum = require('./checksum');
var util = require('./util');
var mkdirp = require('mkdirp');

function defaultFilter(mod) {
  return function(src) {
    var ext = path.extname(src);
    // filter directories
    if (src.match(/\/$/)) {
      return false;
    }
    if (src.match(/cortex-shrinkwrap\.json$/) || src.match(/cortex\.json$/)) {
      return false;
    }
    if (src.split('/').some(function(segment) {
      return segment.indexOf('.') == 0;
    })) {
      return false;
    }

    if (ext == ".js" || ext == ".css") {
      var min = new RegExp("\\.min\\" + ext + "$").test(src);
      var origin = src.match("__origin__");
      if(origin){return false;}
      return mod.min ? min : !min;
    } else {
      return true;
    }
  }
}


function Packer(options) {
  this.root = options.root;
  this.filter = options.filter || defaultFilter;
  this.mods = [];
}

Packer.prototype.add = function(mod) {
  this.mods.push(mod);
};


Packer.prototype.build = function(callback) {
  var self = this;
  var root = this.root;
  var mod = this.mods[0];
  // ignore multi mods;

  async.map(this.mods, function(mod, done) {
    if (_.isString(mod.version)) {
      // single version
      // return directory glob
      self.fullVersionFiles(mod, done);
    } else {
      // range version
      self.patchVersionFiles(mod, done);
    }
  }, function(err, results) {
    if (err) {
      return callback(err);
    }
    var zipArchive = archiver('zip');

    zipArchive.bulk(
      results.map(function(item) {
        return {
          src: item.sources,
          expand: true,
          cwd: item.cwd,
          filter: self.filter(item.mod)
        }
      })
    );

    callback(null, zipArchive);
  });

}

Packer.prototype.fullVersionFiles = function(mod, done) {
  var self = this;
  var name = mod.name;
  var version = mod.version;
  var root = this.root;
  var moddir = path.join(root, name, version);

  this._getShrinked(moddir, function(err, json) {
    if (err) {
      return done(err);
    }
    var arr = [];
    util.iterateMods(json, function(name, version) {
      arr.push({
        name: name,
        version: version
      });
    });
    async.map(arr, function(mod, done){
      util.moduleExists(root, mod, done);
    }, function(err){
      if(err){return done(err)}
      var patterns = arr.map(util.toGlob);
      done(null, {
        sources: patterns,
        cwd: root,
        mod: mod
      });
    });
  });
}


Packer.prototype.getFileList = function(mod, options, done) {
  var root = this.root;
  var pattern = util.toGlob(mod);
  var filter = options.filter || function() {
    return true
  };
  var list = {};

  glob(pattern, {
    cwd: root,
    mark: true
  }, function(err, matches) {
    if (err) {
      return done(err);
    }

    // get md5 list of the files
    matches = matches.filter(filter);

    async.map(matches, function(match, done) {
      var moddir = path.join(root, mod.name, mod.version);
      var match = path.join(root, match);

      md5json
        .read(moddir, {
          no_cache: process.env.SHRINKWRAP_PACKER_NOCACHE == 1
        })
        .get(match, function(err, md5) {
          if (err) {
            return done(err);
          }
          var filepath = path.relative(moddir, match);
          list[filepath] = md5;
          done(null);
        });

    }, function(err) {
      if (err) {
        return done(err);
      }
      done(null, list);
    });
  });
}

Packer.prototype._getShrinked = function(moddir, done) {
  shrinked(path.join(moddir, "cortex-shrinkwrap.json"), {
    dependencyKeys: ["engines", "dependencies", "asyncDependencies"]
  }, function(err, tree) {
    if (err) {
      return done(err);
      return done(new Error('Fail to read cortex-shrinkwrap.json'));
    }
    done(null, tree);
  });
}

// extend {name:"a",version:"0.1.0"}
// to {
//    "<name>":{
//      "<version>":{
//        "<filepath>":"<md5>"
//      }
//    }
//  }
Packer.prototype.extend = function(mod, done, filter) {
  var self = this;
  var root = this.root;
  var moddir = path.join(root, mod.name, mod.version);

  this._getShrinked(moddir, function(err, tree) {
    if (err) {
      return done(err);
    }
    var result = {};

    // shrinkwrap to filelist
    async.map(_.keys(tree), function(modname, done) {
      result[modname] = tree[modname];
      async.map(_.keys(tree[modname]), function(version, done) {
        /* get file list */
        var module = {
          name: modname,
          version: version
        };
        util.moduleExists(root, module, function(err){
          if(err){return done(err);}
          self.getFileList(module, {
            filter: filter
          }, function(err, list) {
            if (err) {return done(err);}
            result[modname][version] = list;
            done(null);
          });
        });
      }, function(err) {
        if (err) {
          return done(err);
        }
        done(null);
      });

    }, function(err) {
      if (err) {
        return done(err);
      }
      done(null, result);
    });

  });

}

Packer.directiveList = function(from, to) {

  var mod_names = _.uniq(_.keys(from).concat(_.keys(to)));

  var directives = [];

  function modDir(name, version) {
    return name + "/" + version + "/";
  }

  function minVersion(versions) {
    var sorted = versions.sort(function(versionA, versionB) {
      return semver.gt(versionA, versionB) ? 1 : -1;
    });
    return sorted[0];
  }

  mod_names.forEach(function(mod_name) {
    var from_mod = from[mod_name];
    var to_mod = to[mod_name];
    if (from_mod && !to_mod) {
      // remove `from` directory
      for (var version in from_mod) {
        directives.push({
          action: "D",
          detail: modDir(mod_name, version)
        });
      }
      return;
    }

    if (!from_mod && to_mod) {
      // add `to` directory
      for (var version in to_mod) {
        directives.push({
          action: "D",
          detail: modDir(mod_name, version)
        });
      };
      return;
    }


    // b@0.0.1 b@0.0.2 -> b@0.0.2 b@0.0.3 b@0.0.4
    //
    // D b@0.0.1
    if (from_mod && to_mod) {
      // deal files in b@0.0.3 b@0.0.4
      // refer to b@0.0.1
      // ignore b@0.0.2 which already exists in `to` directory
      var min_version = minVersion(_.keys(from_mod));
      var min_dir = modDir(mod_name, min_version);
      var ref = from_mod[min_version];
      for (var version in to_mod) {
        // for b@0.0.3 and b@0.0.4
        if (!from_mod[version]) {
          // get their filelists
          var to_list = to_mod[version];
          for (var filepath in to_list) {

            var from_path = path.join(mod_name, min_version, filepath);
            var to_path = path.join(mod_name, version, filepath);
            if (ref[filepath] == to_list[filepath]) {
              directives.push({
                action: "C",
                detail: [from_path, to_path].join(" ")
              });
            } else {
              // not exist in from_list,
              // or md5 not match,
              // use A directive to cover
              directives.push({
                action: "A",
                detail: to_path
              });
            }
          }
        }
      }

      // clear b@0.0.1
      for (var version in from_mod) {

        if (!to_mod[version]) {
          directives.push({
            action: "D",
            detail: modDir(mod_name, version)
          });
        }

      }

      return;
    }
  });

  return directives;
}

Packer.prototype.checksum = function(mod, done) {
  var mod = this.mods[0];

  this.extend(mod, function(err, result) {
    if (err) {
      return done(err);
    }
    checksum.tree(result, done);
  }, this.filter(mod));
}

Packer.prototype.makeZipFolder = function(list, done) {
  var root = this.root;
  var folder = temp.path();
  var content = list.map(function(item) {
    return [item.action, item.detail].join(" ");
  }).join('\n');
  var copyList = list.filter(function(item) {
    return "AM".match(item.action);
  }).map(function(item) {
    var filepath = item.detail;
    return {
      from: path.join(root, filepath),
      to: path.join(folder, filepath)
    };
  });

  mkdirp(folder, function(err) {
    if (err) {
      return done(err);
    }
    async.map(copyList, function(item, done) {
      fse.copy(item.from, item.to, done);
    }, function(err) {
      if (err) {
        return done(err);
      }
      var directive_path = path.join(folder, "directives.txt");
      fs.writeFile(directive_path, content, function(err) {
        if (err) {
          return done(err);
        }
        done(null, folder);
      });
    });
  });
}

Packer.prototype.patchVersionFiles = function(mod, done) {
  var root = this.root;
  var name = mod.name;
  var self = this;
  // get all deps of two version
  async.parallel([

    function(done) {
      self.extend({
        name: name,
        version: mod.version.from
      }, done, self.filter(mod));
    },
    function(done) {
      self.extend({
        name: name,
        version: mod.version.to
      }, done, self.filter(mod));
    }
  ], function(err, results) {
    if (err) {
      return done(err);
    }

    var list = Packer.directiveList(results[0], results[1]);
    self.makeZipFolder(list, function(err, folder) {
      if (err) {
        return done(err);
      }
      done(null, {
        sources: ['**/*', 'directives.txt'],
        cwd: folder,
        mod: mod
      });
    });
  });
}