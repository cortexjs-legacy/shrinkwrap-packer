var Packer = require('../');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var crypto = require('crypto');
var debug = require('debug')('middleware');
var zipspliter = require('./zipspliter');
var Emitter = require('events').EventEmitter;
// var md5stream = crypto.createHash("md5",{encoding:"hex"});
var md5 = require('MD5');
var through = require('through');
var utils = require('./utils');
var contentDisposition = utils.contentDisposition;

function assureDirExists(filepath,callback){
    var dirname = path.dirname(filepath);
    fs.exists(dirname,function(exists){
        if(exists){
            return callback(null,filepath);
        }else{
            mkdirp(dirname,function(err){
                if(err){return callback(err);}
                callback(null,filepath);
            });
        }
    });
}

exports.static = function(option){
    return function(req,res,next){
        var filepath = path.join(option.pack,req.path);
        fs.exists(filepath,function(exists){
            if(!exists){return next();}
            debug('static',req.path);
            if(filepath.match(/\.zip$/)){
              fs.readFile(filepath,function(err,content){
                if(err){return next(err);}
                // TODO: use md5json to get content md5
                res.type('zip');
                res.set('Content-MD5',md5(content));
                res.set('Content-Disposition', contentDisposition(filepath));
                res.send(content);
              });
            }else{
              res.sendfile(filepath);
            }
        });
    }
}
exports.dynamic = function(options){
    var pendingPaths = {};
    var emitter = new Emitter();
    emitter.setMaxListeners(5000);
    return function(req, res, next){
        var root = options.root; // directory of module root
        var pack = options.pack || root;
        var pathname = req.path;
        /* request delegate */
        emitter.once('done:' + pathname, function(result){
            debug('dynamic',pathname);
            res.end(result);
        });

        if(pendingPaths[pathname]){return;}

        function responseBack(resp){
          emitter.emit('done:' + pathname , resp);
          delete pendingPaths[pathname];
        }
        pendingPaths[pathname] = true;
        /* end of request delegate */
        debug('computing',pathname);

        var packer = new Packer(options);
        var moddefine = zipspliter(pathname);
        var filepath = path.join(pack,pathname);
        if(!moddefine){return next();}



        if(_.isArray(moddefine)){
            moddefine.forEach(function(mod){
                packer.add(mod);
            });
        }else{
            packer.add(moddefine);
        }

        assureDirExists(filepath,function(err){
            if(err){return next(err);}
            if(moddefine.checksum){

                packer.checksum(moddefine,function(err,checksum){
                    if(err){return next();}
                    fs.writeFile(filepath,checksum,function(err){
                        if(err){return next();}
                        res.type('application/octet-stream');
                        responseBack(checksum);
                    });
                });

            }else{
                packer.build(function(err,stream){
                    if(err){return next(err);}
                    var file = fs.createWriteStream(filepath);
                    stream.pipe(file);

                    file.on('close',function(){
                        fs.readFile(filepath,function(err,content){
                            res.set('Content-MD5',md5(content));
                            res.set('Content-Disposition', contentDisposition(filepath));
                            res.type('zip');
                            responseBack(content);
                        });
                    });
                    stream.finalize();
                });
            }
        });
    }
}