var Packer = require('../');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var crypto = require('crypto');
var zipspliter = require('./zipspliter');
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

module.exports = function(options){
    return function(req, res, next){
        var root = options.root; // directory of module root
        var pack = options.pack || root;
        var packer = new Packer(options);
        var moddefine = zipspliter(req.path);
        var filepath = path.join(pack,req.path);
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
                        res.end(checksum);
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
                            res.send(content);
                        });
                    });
                    stream.finalize();
                });
            }
        });
    }
}