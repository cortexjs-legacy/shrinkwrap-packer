'use strict';

var Packer = require('../');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var crypto = require('crypto');
var async = require('async');
var debug = require('debug')('middleware');
var zipspliter = require('./zipspliter');
var md5 = require('./md5');
var LRU = require("lru-cache");
var checksum = require("./checksum");
var cache = LRU(500);

function assureDirExists(filepath, callback) {
  var dirname = path.dirname(filepath);
  fs.exists(dirname, function(exists) {
    if (exists) {
      return callback(null, filepath);
    } else {
      mkdirp(dirname, function(err) {
        if (err) {
          return callback(err);
        }
        callback(null, filepath);
      });
    }
  });
}

function getMd5(filepath, done, option) {
  var hash = cache.get(filepath);
  if(hash){
    return done(null, hash);
  }
  var md5path = filepath + '.md5';

  fs.exists(md5path, function(exists) {
    if (exists) {
      fs.readFile(md5path, 'utf8', done);
    } else {
      fs.readFile(filepath, function(err, content) {
        if (err) {
          return done(err);
        }
        var hash = md5(content);
        var tasks = [];
        tasks.push(function(done){
          fs.writeFile(md5path, hash, function(err){
            if(err){return done(err);}
            done(null);
          });
        });

        tasks.push(function(done){
          cache.set(filepath, hash);
          done(null, hash);
        });

        async.waterfall(tasks, done);
      });
    }
  });
}

exports.errorHandler = function(err, req, res, next) {
  err.stack && console.error(err.stack);
  if(err.code && err.message){
    return res.send(err.code, err.message);
  }
  res.send(404, err && err.message ? err.message : "not found");
}

exports.static = function(option) {
  return function(req, res, next) {
    var filepath = path.join(option.pack, req.path);
    fs.exists(filepath, function(exists) {
      if (!exists) {
        return next();
      }
      debug('static', req.path);
      if (filepath.match(/\.zip$/)) {
        getMd5(filepath, function(err, hash) {
          if (err) {
            return next(err);
          }
          res.set('Content-MD5', hash);
          res.sendfile(filepath);
        }, option);
      } else {
        res.sendfile(filepath);
      }
    });
  }
}

exports.dynamic = function(options) {
  var pendingPaths = {};
  var listeners = {};
  return function(req, res, next) {
    var root = options.root; // directory of module root
    var pack = options.pack || root;
    var pathname = req.path;
    // /name/version.zip
    // /name/version~version.zip
    // /name/version-checksum
    // /name/version.zip.md5
    var pathreg = /^\/.*\/.*$/;
    /* request delegate */
    var event_name = "done:" + pathname;
    var listener = listeners[event_name] || (listeners[event_name] = []);

    listener.push(function(err,result){
      debug('dynamic', pathname);
      if (err) {
        if (_.isString(err)) {
          err = new Error(err);
        }
        return next(err);
      }
      res.sendfile(result);
    });

    if (pendingPaths[pathname]) {
      return;
    }

    function responseBack(err, resp) {
      listener.forEach(function(func){
        func.call(this,err,resp);
      });
      listeners[event_name].length = 0;
      delete pendingPaths[pathname];
    }
    pendingPaths[pathname] = true;
    /* end of request delegate */
    debug('computing', pathname);
    if (!pathname.match(pathreg)) {
      return responseBack({
        code: 400,
        message: 'Invalid path'
      });
    }
    var packer = new Packer(options);
    var moddefine = zipspliter(pathname);
    var filepath = path.join(pack, pathname);
    if (!moddefine) {
      return responseBack({
        code: 400,
        message: "Zip Router Parse Fail"
      });
    }



    if (_.isArray(moddefine)) {
      moddefine.forEach(function(mod) {
        packer.add(mod);
      });
    } else {
      packer.add(moddefine);
    }

    fs.exists(path.join(root, moddefine.name), function(exists) {
      if (!exists) {
        return responseBack({
          code: 404,
          message: moddefine.name + ' Not Found'
        });
      }
      assureDirExists(filepath, function(err) {
        if (err) {
          return responseBack(err);
        }
        if (moddefine.checksum) {
          packer.checksum(moddefine, function(err, checksum) {
            if (err) {
              return responseBack(err);
            }

            var tasks = [];
            tasks.push(function(done){
              fs.writeFile(filepath, checksum, function(err){
                if(err){return done(err);}
                done(null);
              });
            });
            tasks.push(function(done){
              res.type('application/octet-stream');
              done(null, filepath);
            });
            async.waterfall(tasks,responseBack);
          });

        } else {
          packer.build(function(err, result) {
            if (err) {
              return responseBack(err);
            }
            var stream = result.stream;
            var folder = result.cwd;
            var file = fs.createWriteStream(filepath);
            stream.pipe(file);
            file.on('close', function() {
              fs.readFile(filepath, function(err, content) {
                var contentmd5 = md5(content);
                var tasks = [];

                if(!result.isFullVersion){
                  tasks.push(function(done){
                    console.log("removing ",folder);
                    fse.remove(folder,done);
                  });
                }

                tasks.push(function(done){
                  fs.writeFile(filepath + '.md5', contentmd5, function(err){
                    if(err){return done(err);}
                    done(null);
                  });
                });

                tasks.push(function(done){
                  res.set('Content-MD5', contentmd5);
                  cache.set(filepath,contentmd5);
                  done(null, filepath);
                });

                async.waterfall(tasks, responseBack);
              });
            });
            stream.finalize();
          });
        }
      });
    });
  }
}