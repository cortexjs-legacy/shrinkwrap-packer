'use strict';
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

function toGlob(mod){
    var dir = path.join(mod.name,mod.version);
    return path.join(dir,"**","*");
}


Packer.prototype.fullVersionFiles = function(mod,done){
    var name = mod.name;
    var version = mod.version;
    var root = this.root;
    var moddir = path.join(this.root,name,version);

    shrinkwrap.read(moddir,function(err,json){
        if(err){return done(err);}
        var me = [{name:json.name,version:json.version}];
        var arr = shrinkwrap.flatten(json);
        var patterns = me.concat(arr).map(toGlob);
        done(null, patterns);
    },'cortex');
}

Packer.prototype.patchVersionFiles = function(mod,done){
    var self = this;
    var root = this.root;
    var name = mod.name;
    var from = mod.version.from;
    var to = mod.version.to;
    var modprefix = new RegExp('^' + name + '\\/');

    // return {'<filepath>:'<md5>'}
    // should distinguish self file and its' deps
    function extend(mod,done){


        var moddir = path.join(root,mod.name,mod.version);

        shrinkwrap.read(moddir,function(err,json){
            if(err){return done(err);}
            var me = {name:json.name,version:json.version};
            var deps = shrinkwrap.flatten(json);
            var pattern = toGlob(me);

            var list = {};
            glob(pattern, {
                cwd: root
            }, function(err, matches){
                if(err){return done(err);}
                // get md5 list of the matched files
                // and return
                async.map(matches,function(match,done){
                    var moddir = path.join(root,mod.name,mod.version);
                    var match = path.join(root,match);

                    md5json
                    .read(moddir)
                    .get(match, function(err, md5){
                        if(err){return done(err);}
                        var filepath = path.relative(root,match);
                        if(filepath.match(modprefix)){
                            list[ filepath ] = md5;
                        }
                        done(null);
                    });
                },function(){
                    done(null,{
                        list: list,
                        dependencies: deps
                    })
                });
            });
        },'cortex');
    }

    function modPrefix(name,version){
        return new RegExp('^' + name + '\\/' + version + '\\/');
    }

    function trimModPrefix(list, mod){
        var result = {};
        for(var file in list){
            result[file.replace(modPrefix(mod.name,mod.version),'')] = list[file];
        }
        return result;
    }

    function pickDiffs(lists){

        var from_list = trimModPrefix(lists[0].list, {
            name:name,
            version:from
        });
        var to_list = trimModPrefix(lists[1].list, {
            name:name,
            version:to
        });

        var list = [];
        var filelist = _.uniq(_.keys(from_list).concat(_.keys(to_list)));


        filelist.forEach(function(file){
            if(from_list[file] == to_list[file]){return;}
            var modifier;

            if(from_list[file] && !to_list[file]){
                modifier = "-";
            }else if(!from_list[file] && to_list[file]){
                modifier = "+";
            }else if(from_list[file] != to_list[file]){
                modifier = "M";
            }

            list.push({
                "modifier": modifier,
                "path": file
            });
        });

        return list;
    }

    function makeDepDiffs(lists){
        var from = lists[0].dependencies;
        var to = lists[1].dependencies;
        var diffs = to.filter(function(mod){

            var exists_in_from = from.some(function(m){
                return m.name == mod.name && m.version == mod.version;
            });

            return !exists_in_from;
        });
        return diffs.map(toGlob);
    }


    function makeChangeList(list,done){
        var content = list.map(function(item){
            return [item.modifier,item.path].join(' ')
        }).join('\n');
        var filename = path.join(root, [name, [from,to].join('~') ].join('@') + ".txt");
        fs.writeFile(filename,content,function(err){
            if(err){return done(err);}
            done(null,filename);
        });
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
    ],function(err, lists){
        if(err){return done(err);}

        var list = pickDiffs(lists);

        makeChangeList(list,function(err,changelog){
            if(err){return done(err);}
            var filelist = list.filter(function(item){return item.modifier!=='-'}).map(function(item){return path.join(name,to,item.path)});
            var depfilelist = makeDepDiffs(lists);
            filelist = filelist.concat(depfilelist);
            filelist.push(path.relative(root,changelog));

            done(null, filelist);
        });
    });
}


module.exports = Packer;

