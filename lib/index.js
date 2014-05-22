var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var mkdirp = require('mkdirp');
var async = require('async');
var _ = require('underscore');
var glob = require('glob');
var md5json = require('md5-json');

function defaultFilter(mod, src){
    var ext = path.extname(src);
    if(ext == ".js" || ext == ".css"){
        return mod.min ? new RegExp("\\.min\\" + ext + "$").test(src) : true;
    }else{
        return true;
    }
}



function flatternShrink(name,config,result){
    var result = result || [];
    result.push({
        name: name || config.name,
        version: config.version
    });
    for(var name in config.dependencies){
        flatternShrink(name,config.dependencies[name],result);
    }

    return result;
}

/**
 * read shrink from directory
 */
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


var Packer = function(options){
    this.root = options.root;
    this.filter = options.filter || defaultFilter;
    this.mods = [];
}


Packer.prototype.add = function(name,version){
    this.mods.push({
        name:name,
        version:version
    });
};


Packer.prototype.build = function(callback){
    var self = this;

    var zipArchive = archiver('zip');

    async.map(this.mods, function(mod,done){
        if(_.isString(mod.version)){
            // single version
            // return directory glob
            this.fullVersionFiles(mod,done);
        }else{
            // range version
            this.patchVersionFiles(mod,done);
        }
    }, function(err, sources){

        if(err){return callback(err);}

        zipArchive.bulk([
          { src: sources.map(), expand:true, cwd: path.dirname(root), filter: function(src){
            return filter(mod,src);
          }},
        ]);
        callback(null,zipArchive);

    });

}


Packer.prototype.fullVersionFiles = function(mod,done){
    var name = mod.name;
    var version = mod.version;
    var root = this.root;
    var moddir = path.join(this.root,name,version);

    function toDirs(mod){
        return path.join(mod.name,mod.version);
    }
    function toGlob(dir){
        return path.join(dir,"**","*");
    }

    readShrink(moddir,function(err,json){
        if(err){return done(err);}
        var mods = flatternShrink(null,json);
        var patterns = mods.map(toDirs).map(toGlob);
        done(null, patterns);
    });
}

Packer.prototype.patchVersionFiles = function(mod,done){
    var self = this;
    var root = this.root;
    var name = mod.name;
    var from = mod.version.from;
    var to = mod.version.to;

    // return {'<filepath>:'<md5>'}
    function extend(mod,done){
        self.fullVersionFiles({
            name: mod.name,
            version: mod.version
        },function(err,patterns){
            if(err){return done(err);}
            var list = {};
            async.map(patterns,function(pattern,done){
                var ziproot = path.join(root,"..");
                glob(pattern,{
                    cwd: root
                },function(err, matches){
                    if(err){return done(err);}
                    async.map(matches,function(match,done){
                        var moddir = path.join(root,mod.name,mod.version);
                        match = path.join(root,match);

                        md5json
                        .read(moddir)
                        .get(match, function(err, md5){
                            if(err){return done(err);}
                            list[match] = md5;
                            done(null);
                        });
                    },done);
                });
            },function(err){
                if(err){return err;}
                done(null,list);
            });
        });
    }

    function pickDiffs(from,to){
        for(var file in from){
            if(from[file] == to[file]){
                delete to[file];
            }
        }
        return _.keys(to);
    }

    async.parallel([
        function(done){
            extend({
                name:name,
                version:from
            },done);
        },
        function(done){
            extend({
                name:name,
                version:to
            },done);

        }
    ],function(err, file_lists){
        if(err){return done(err);}
        diffs = pickDiffs(file_lists[0],file_lists[1]).map(function(filepath){
            return path.relative(root,filepath);
        });
        done(null, diffs);
    });
}


module.exports = Packer;

