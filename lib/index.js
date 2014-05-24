var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var mkdirp = require('mkdirp');
var async = require('async');
var _ = require('underscore');
var glob = require('glob');
var md5json = require('md5-json');
var shrinkwrap = require('shrinkwrap-reader');


function defaultFilter(mod, src){
    var ext = path.extname(src);
    if(ext == ".js" || ext == ".css"){
        return mod.min ? new RegExp("\\.min\\" + ext + "$").test(src) : true;
    }else{
        return true;
    }
}


var Packer = function(options){
    this.root = options.root;
    this.filter = options.filter || defaultFilter;
    this.mods = [];
}


Packer.prototype.add = function(mod){
    this.mods.push(mod);
};


Packer.prototype.build = function(callback){
    var self = this;
    var root = this.root;

    async.map(this.mods, function(mod,done){
        if(_.isString(mod.version)){
            // single version
            // return directory glob
            self.fullVersionFiles(mod,done);
        }else{
            // range version
            self.patchVersionFiles(mod,done);
        }
    }, function(err, sources){
        if(err){return callback(err);}
        sources = _.flatten(sources)
        var zipArchive = archiver('zip');
        zipArchive.on('error',function(e){
            console.error(e);
        });

        zipArchive.bulk([
          { src: sources, expand:true, cwd: root},
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

    shrinkwrap.read(moddir,function(err,json){
        if(err){return done(err);}
        var me = [{name:json.name,version:json.version}];
        arr = shrinkwrap.flatten(json);
        var patterns = me.concat(arr).map(toDirs).map(toGlob);
        done(null, patterns);
    },'cortex');
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

