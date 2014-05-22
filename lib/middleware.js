var Packer = require('../');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var _ = require('underscore');

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

        var zipdefine = req.zipdefine;
        if(!zipdefine){return next();}

        var root = options.root; // directory of module root
        var pack = options.pack || root;

        var packer = new Packer(options);

        if(_.isArray(zipdefine)){
            zipdefine.forEach(function(name,version){
                packer.add(name,version);
            });
        }else{
            packer.add(mod, options);
        }

        packer.build(function(err,stream){
            if(err){return next(err);}
            var filepath = path.join(path.dirname(pack),req.path);
            assureDirExists(filepath,function(err){
                if(err){return next();}
                var file = fs.createWriteStream(filepath);

                stream.pipe(file);
                stream.pipe(res);
                stream.finalize();
            });
        });

    }
}