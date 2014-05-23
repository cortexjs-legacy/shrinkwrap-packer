var Packer = require('../');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var zipspliter = require('./zipspliter');

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
        var moddefine = zipspliter(req.path);
        if(!moddefine){return next();}

        var root = options.root; // directory of module root
        var pack = options.pack || root;

        var packer = new Packer(options);

        if(_.isArray(moddefine)){
            moddefine.forEach(function(mod){
                packer.add(mod);
            });
        }else{
            packer.add(moddefine);
        }

        var filepath = path.join(pack,req.path);
        assureDirExists(filepath,function(err){
            if(err){return next(err);}
            packer.build(function(err,stream){
                if(err){return next();}
                var file = fs.createWriteStream(filepath);
                stream.pipe(file);
                file.on('close',function(){
                    stream.pipe(res);
                });
                stream.finalize();
            });
        });

    }
}