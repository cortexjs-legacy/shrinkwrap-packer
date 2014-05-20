var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var mkdirp = require('mkdirp');

function defaultFilter(mod, src){
    var ext = path.extname(src);
    if(ext == ".js" || ext == ".css"){
        return mod.min ? new RegExp("\\.min\\" + ext + "$").test(src) : true;
    }else{
        return true;
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

module.exports = function(mod, options, callback){

        var filter = options.filter || defaultFilter;
        var root = options.root;
        var moddir = modDir(root, mod); // directory of the root module

        var zipArchive = archiver('zip');

        function toGlob(dir){
            var rootdir = path.basename(root);
            return path.join(rootdir,dir,"**","*");
        }

        readShrink(moddir,function(err,json){
            if(err){return next();}
            var mods = flatternShrink(null,json);
            var dirs = toDirs(root,mods).map(toGlob);

            zipArchive.bulk([
              { src: dirs, expand:true, cwd: path.dirname(root), filter: function(src){
                return filter(mod,src);
              }},
            ]);
            callback(zipArchive);
        });
}



