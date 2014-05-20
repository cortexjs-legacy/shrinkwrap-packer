var packer = require('../');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

// /packages/a@0.1.0.zip
// -> {name:mod,version:1.0.1}
function defaultConverter(root,urlpath){
    var rootname = path.basename(root);
    var reg = new RegExp("\\/"+rootname+"\\/([a-z0-9-_]+)@(\\d+\\.\\d+\\.\\d+)(\\.min)?\\.zip$");
    var mod = urlpath.match(reg);

    if(!mod || !mod[1]){
        return false;
    }

    return {
        name: mod[1],
        version: mod[2],
        min: !!mod[3],
    }
}



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
        var converter = options.converter || defaultConverter;
        var root = options.root; // directory of module root
        var pack = options.pack || root;
        var mod = converter(pack,req.path);
        if(!mod){return next();}

        var filepath = path.join(path.dirname(pack),req.path);

        packer(mod, options, function(stream){

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