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

function getMd5(filepath,done){
    var md5path = filepath + '.md5';

    fs.exists(md5path,function(exists){
        if(exists){
            fs.readFile(md5path,'utf8',done);
        }else{
            fs.readFile(filepath,function(err,content){
                if(err){return done(err);}
                var hash = md5(content);
                fs.writeFile(md5path,hash,function(err){
                    if(err){return done(err);}
                    done(null,hash);
                });
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
                getMd5(filepath,function(err,hash){
                    if(err){return next(err);}
                    res.set('Content-MD5',hash);
                    res.sendfile(filepath);
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
    var NotFound = new Error('Not Found');
    emitter.setMaxListeners(5000);
    return function(req, res, next){
        var root = options.root; // directory of module root
        var pack = options.pack || root;
        var pathname = req.path;
        /* request delegate */
        emitter.once('done:' + pathname, function(err, result){
            debug('dynamic',pathname);
            if(err){return next(err==NotFound?null:err);}
            res.sendfile(result);
        });

        if(pendingPaths[pathname]){return;}

        function responseBack(err, resp){
          emitter.emit('done:' + pathname , err, resp);
          delete pendingPaths[pathname];
        }
        pendingPaths[pathname] = true;
        /* end of request delegate */
        debug('computing',pathname);

        var packer = new Packer(options);
        var moddefine = zipspliter(pathname);
        var filepath = path.join(pack,pathname);
        if(!moddefine){return responseBack(NotFound);}



        if(_.isArray(moddefine)){
            moddefine.forEach(function(mod){
                packer.add(mod);
            });
        }else{
            packer.add(moddefine);
        }

        assureDirExists(filepath,function(err){
            if(err){return responseBack(err);}
            if(moddefine.checksum){

                packer.checksum(moddefine,function(err,checksum){
                    if(err){return responseBack(NotFound);}
                    fs.writeFile(filepath,checksum,function(err){
                        if(err){return responseBack(NotFound);}
                        res.type('application/octet-stream');
                        responseBack(filepath);
                    });
                });

            }else{
                packer.build(function(err,stream){
                    if(err){return responseBack(err);}
                    var file = fs.createWriteStream(filepath);
                    stream.pipe(file);

                    file.on('close',function(){
                        fs.readFile(filepath,function(err,content){
                            var contentmd5 = md5(content);
                            fs.writeFile(filepath+'.md5',contentmd5,function(err){
                                if(err){return responseBack(err);}
                                res.set('Content-MD5',contentmd5);
                                responseBack(filepath);
                            });
                        });
                    });
                    stream.finalize();
                });
            }
        });
    }
}