'use strict';
var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var archiver = require('archiver');
var async = require('async');
var _ = require('underscore');
var glob = require('glob');
var md5json = require('md5-json');
var shrinkwrap = require('shrinkwrap-reader');
var semver = require('semver');
var temp = require('temp');
var md5 = require('MD5');

function defaultFilter(mod){
    return function(src){
        var ext = path.extname(src);
        // filter directories
        if(src.match(/\/$/)){return false;}
        if(src.match(/cortex-shrinkwrap\.json$/)){
            return false;
        }
        if(src.split('/').some(function(segment){
            return segment.indexOf('.') == 0;
        })){
            return false;
        }
        if(ext == ".js" || ext == ".css" || ext == ".html"){
            var min = new RegExp("\\.min\\" + ext + "$").test(src);
            return mod.min ? min : !min;
        }else{
            return true;
        }
    }
}


var Packer = function(options){
    this.root = options.root;
    this.filter = options.filter || defaultFilter;
    this.mods = [];
}

var FailToReadShrinkwrap = new Error('Fail to read cortex-shrinkwrap.json');

Packer.prototype.checksum = function(mod,done){
    var self = this;

    function generate(filelist){
        var arr = [];
        for(var filepath in filelist){
            arr.push(md5(filepath) + filelist[filepath]);
        }
        return md5(arr.sort().join(''));
    }

    this.mods.forEach(function(mod){

        self.extend(mod,function(err,result){
            if(err){return done(err);}
            done(null, generate(result.list));
        },self.filter(mod));

    });
}

Packer.prototype.add = function(mod){
    this.mods.push(mod);
};


Packer.prototype.build = function(callback){
    var self = this;
    var root = this.root;
    var mod = this.mods[0];
    // ignore multi mods;

    async.map(this.mods, function(mod,done){
        if(_.isString(mod.version)){
            // single version
            // return directory glob
            self.fullVersionFiles(mod,done);
        }else{
            // range version
            self.patchVersionFiles(mod,done);
        }
    }, function(err, results){
        if(err){return callback(err);}
        var zipArchive = archiver('zip');

        zipArchive.bulk(
            results.map(function(item){
                return { src: item.sources, expand:true, cwd: item.cwd, filter: self.filter(item.mod)}
            })
        );

        callback(null,zipArchive);
    });

}

function toGlob(mod){
    var dir = path.join(mod.name,mod.version);
    return path.join(dir,"**","*");
}

function filterObject(object, filter){
    var result = {};
    for(var key in object){
        if(filter(key)){
            result[key] = object[key];
        }
    }
    return result;
}

Packer.prototype.fullVersionFiles = function(mod,done){
    var self = this;
    var name = mod.name;
    var version = mod.version;
    var root = this.root;
    var moddir = path.join(root,name,version);

    shrinkwrap.read(moddir,function(err,json){
        if(err){return done(FailToReadShrinkwrap);}
        var me = [{name:json.name,version:json.version}];
        var arr = shrinkwrap.flatten(json);
        var patterns = me.concat(arr).map(toGlob);

        done(null, {
            sources:patterns,
            cwd: root,
            mod: mod
        });
    },'cortex');
}

// change [{name:a,version:0.1.0},{name:b,version:0.0.1},{name:b,version:0.0.2}]
// to {a:[0.1.0],b:[0.0.1,0.0.2]}
Packer.versionMap = function(mods){
    var result = {};
    mods.forEach(function(mod){
        if(!result[mod.name]){
            result[mod.name] = [mod.version]
        }else{
            result[mod.name].push(mod.version);
        }
    });
    return result;
}

Packer.minVersion = function(versions){
    var sorted = versions.sort(function(versionA,versionB){
        return semver.gt(versionA,versionB) ? 1 : -1;
    });
    return sorted[0];
}

// extend {name:"a",version:"0.1.0"}
// to {
//     versionMap: <versionMap>,
//     list:[
//         <path>:<md5>
//     ]
// }
Packer.prototype.extend = function(mod,done,filter){
    var root = this.root;
    var moddir = path.join(root,mod.name,mod.version);

    shrinkwrap.read(moddir,function(err,json){
        if(err){return done(FailToReadShrinkwrap);}
        var unit = {
            name:json.name,
            version:json.version
        };
        var mods = [{name:json.name,version:json.version}].concat(shrinkwrap.flatten(json));

        var versions = Packer.versionMap(mods);

        var list = {};
        // for every mods
        async.map(mods,function(mod,done){
            var pattern = toGlob(mod);
            // get matched files with glob
            glob(pattern, {
                cwd: root,
                mark: true
            }, function(err, matches){
                if(err){return done(err);}
                // get md5 list of the files
                matches = matches.filter(filter||function(){return true;});
                async.map(matches,function(match,done){
                    var moddir = path.join(root,mod.name,mod.version);
                    var match = path.join(root,match);

                    md5json
                    .read(moddir)
                    .get(match, function(err, md5){
                        if(err){return done(err);}
                        var filepath = path.relative(root,match);

                        list[ filepath ] = md5;

                        done(null);
                    });
                },done);
            });
        },function(err){
            if(err){return done(err);}
            done(null,{
                versionMap:versions,
                list:list
            });
        });
    },'cortex');
}

Packer.directiveList = function(results){
    var from = results[0];
    var to = results[1];

    var from_list = from.list;
    var to_list = to.list;


    var from_versions = from.versionMap;
    var to_versions = to.versionMap;

    var mod_names = _.uniq(_.keys(from_versions).concat(_.keys(to_versions)));

    var directives = [];

    function modDir(name,version){
        return name + "/" + version + "/";
    }

    function isVersion(name,version){
        return function(file){
            return file.indexOf(modDir(name,version)) == 0;
        }
    }

    mod_names.forEach(function(mod_name){
        var from_mod = from_versions[mod_name];
        var to_mod = to_versions[mod_name];
        if(from_mod && !to_mod){
            // remove `from` directory
            from_mod.forEach(function(version){
                directives.push({
                    action: "D",
                    detail: modDir(mod_name,version)
                });
            });
            return;
        }

        if(!from_mod && to_mod){
            // add `to` directory
            to_mod.forEach(function(version){
                directives.push({
                    action: "D",
                    detail: modDir(mod_name,version)
                });
            });
            return;
        }


        // b@0.0.1 b@0.0.2 -> b@0.0.2 b@0.0.3 b@0.0.4
        //
        // D b@0.0.1
        if(from_mod && to_mod){
            // deal files in b@0.0.3 b@0.0.4
            // refer to b@0.0.1
            // ignore b@0.0.2
            var min_version = Packer.minVersion(from_mod);
            var min_dir = modDir(mod_name,min_version);
            to_mod.forEach(function(version){
                // for b@0.0.3 and b@0.0.4
                if(from_mod.indexOf(version) == -1){
                    // get there filelists
                    var to_dir = modDir(mod_name, version);

                    for(var to_path in filterObject(to_list,isVersion(mod_name,version))){

                        var from_path = to_path.replace(to_dir,min_dir);

                        if(from_list[from_path] == to_list[to_path]){
                            directives.push({
                                action: "C",
                                detail: [from_path,to_path].join(" ")
                            });
                        }else{
                            // not exist in from_list: !from_list[from_path]
                            // or md5 not match: from_list[from_path] !== to_list[to_path]
                            directives.push({
                                action: "A",
                                detail: to_path
                            });
                        }

                    }

                }
            });

            // clear b@0.0.1
            from_mod.forEach(function(version){
                if(to_mod.indexOf(version) == -1){
                    directives.push({
                        action: "D",
                        detail: modDir(mod_name,version)
                    });
                }
            });
            return;
        }
    });

    return directives;
}


Packer.prototype.makeZipFolder = function(list,done){
    var root = this.root;
    var folder = temp.path();
    var content = list.map(function(item){
        return [item.action,item.detail].join(" ");
    }).join('\n');
    var copyList = list.filter(function(item){
        return "AM".match(item.action);
    }).map(function(item){
        var filepath = item.detail;
        return {
            from: path.join(root,filepath),
            to: path.join(folder,filepath)
        };
    });

    async.map(copyList,function(item,done){
        fse.copy(item.from,item.to,done);
    },function(err){
        if(err){return done(err);}
        var directive_path = path.join(folder, "directives.txt");
        fs.writeFile( directive_path, content, function(err){
            if(err){return done(err);}
            done(null,folder);
        });
    });

}

Packer.prototype.patchVersionFiles = function(mod, done){
    var root = this.root;
    var name = mod.name;
    var self = this;
    // get all deps of two version
    async.parallel([
        function(done){
            self.extend({
                name:name,
                version: mod.version.from
            },done,self.filter(mod));
        },
        function(done){
            self.extend({
                name:name,
                version: mod.version.to
            },done,self.filter(mod));
        }
    ],function(err, results){
        if(err){return done(err);}

        var list = Packer.directiveList(results);
        self.makeZipFolder(list,function(err,folder){
            if(err){return done(err);}
            done(null, {
                sources: ['**/*','directives.txt'],
                cwd: folder,
                mod: mod
            });
        });
    });
}


module.exports = Packer;

