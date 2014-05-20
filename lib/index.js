var vinyl = require('vinyl-fs');
var fs = require('fs');
var path = require('path');
var archiver = require('archiver');

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

function modDir(root,mod){
    return path.join(root,mod.name,mod.version);
}

function toDirs(root,mods){
    return mods.map(function(mod){
        return path.join(mod.name,mod.version);
    });
}

function flatternShrink(name,config,result){
    var result = result || [];
    result.push({
        name: name || config.name,
        version:config.version
    });
    for(var name in config.dependencies){
        flatternShrink(name,config.dependencies[name],result);
    }

    return result;
}

function readShrink(dir,callback){
    var filepath = path.join(dir,"cortex-shrinkwrap.json");
    fs.exists(filepath,function(exists){
        if(!exists){return callback(true);}
        fs.readFile(filepath,function(err,content){
            if(err){return callback(err);}
            try{
                json = JSON.parse(content)
            }catch(e){
                return callback(e);
            }

            callback(null,json);
        });
    });
}

function assureDirExists(filepath,callback){
    var dirname = path.dirname(filepath);
    fs.exists(dirname,function(exists){
        if(exists){
            return callback(null,filepath);
        }else{
            mkdirp(dirname,function(err){
                if(err){return callback(err);}
                callback(null,filename);
            });
        }
    });
}

module.exports = function(options){
    var converter = options.converter || defaultConverter;
    return function(req, res, next){
        var root = options.root; // directory of module root
        var mod = converter(root,req.path);
        if(!mod){return next()}
        var moddir = modDir(root,mod); // directory of the root module

        function toGlob(dir){
            var rootdir = path.basename(root);
            return path.join(rootdir,dir,"**","*");
        }

        function minFiles(src){
            var ext = path.extname(src);
            if(ext == ".js" || ext == ".css"){
                return mod.min ? new RegExp("\\.min\\" + ext + "$").test(src) : true;
            }else{
                return true;
            }
        }

        readShrink(moddir,function(err,json){
            if(err){return next();}
            var mods = flatternShrink(null,json);
            var dirs = toDirs(root,mods).map(toGlob);
            var filepath = path.join(path.dirname(root),req.path);

            assureDirExists(filepath, function(err){
                var file = fs.createWriteStream(filepath);
                var zipArchive = archiver('zip');

                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Encoding': 'gzip'
                });

                zipArchive.bulk([
                  { src: dirs, expand:true, cwd: path.dirname(root), filter: minFiles },
                ]);

                zipArchive.pipe(res);
                zipArchive.pipe(file);

                file.on('close',function(){
                    res.end();
                });
                zipArchive.finalize();

            });

        });
    }
}



