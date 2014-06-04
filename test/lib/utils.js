var path = require('path');
var async = require('async');
var fse = require('fs-extra');
var fs = require('fs');
var unzip = require('unzip');
var fstream = require('fstream');
var mkdirp = require('mkdirp');
var request = require('supertest');
var glob = require('glob');
var debug = require('debug')('apptest');
var exec = require('child_process').exec;
var md5 = require('../../lib/md5');

exports.extract = function(zippath,folder,done){
  folder = folder.replace(/\.min$/,'');
  var readStream = fs.createReadStream(zippath);
  mkdirp(folder,function(err){
    if(err){return done(err);}
    exec('unzip ' + zippath + ' -d ' + folder, function(err,stdout,stderr){
      if(err){return done(err);}
      done(null);
    });
  });
}

exports.runDirectives = function(directives, tmpdir, rootdir, done){

  async.mapSeries(directives,function(directive,_done){

    var action = directive.action;
    var detail = directive.detail;
    var from_path, to_path;

    if(action == "C" || action == "R"){
      var splited = detail.split(" ");
      from_path = path.join(rootdir,splited[0]);
      to_path = path.join(rootdir,splited[1]);
    }else{
      from_path = path.join(tmpdir, detail);
      to_path = path.join(rootdir, detail);
    }


    function done(){
      _done.apply(null,arguments);
    }

    switch(action){
      case "C":
      case "M":
      case "A":
        debug('cp',action,from_path,to_path);
        fse.copy(from_path,to_path,done);
        break;
      case "R":
        debug('mv',action,from_path,to_path);
        fse.move(from_path,to_path,done);
        break;
      case "D":
        debug('rm',action,to_path);
        fse.remove(to_path,done);
        break;
    }

  },done);

}

exports.checksum = function(dir,done){
  glob('**/*',{
    cwd: dir,
    mark: true
  },function(err, matches){
    if(err){return done(err);}
    matches = matches.filter(function(item){return !item.match(/\/$/);});
    async.map(matches,function(item,done){
      fs.readFile(path.join(dir,item),function(err,content){
        if(err){return done(err);}
        done(null,md5(item)+md5(content));
      });
    },function(err,list){
      if(err){return done(err);}
      done(null,md5(list.sort().join('')));
    });
  });
};

exports.verifyPatch = function(app,patch,done){
  var isMin = patch.match(/\.min$/);
  patch = patch.replace(/\.min$/,'');
  var splited = patch.split('@');
  var name = splited[0];
  var range = splited[1].split('~');
  var from = range[0];
  var from_origin = from + '-origin';
  var to = range[1];
  var zippaths = [
    '/zip/'+name+'/'+from+(isMin?'.min':'')+'.zip',
    '/zip/'+name+'/'+to+(isMin?'.min':'')+'.zip',
    '/zip/'+name+'/'+from+'~'+to+(isMin?'.min':'')+'.zip'
  ];

  var checksumpath = '/zip/' + name + '/' + to + (isMin?'.min':'') + '-checksum';

  range = range.join('~');
  function p(filepath){return path.join(__dirname,'..','tmp','units',filepath);}

  async.map(zippaths, function(zippath,done){
    debug('request',zippath);
    request(app)
      .get(zippath)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        extract();
      });

    function extract(){
      exports.extract(
          path.join(__dirname, '..','fixtures',zippath),
          p(path.basename(zippath,'.zip')),
          function(err){
            if(err) throw err;
            debug('extract',zippath);
            done();
          }
        );
    }

  }, function(err){
    if(err) throw err;

    // all extracted
    fse.move( p(to), p(from_origin),function(err){
      if(err) throw err;

      fse.copy( p(from), p(to), function(err){
        if(err) throw err;

        fs.readFile( p(range + '/directives.txt'), 'utf8', function(err,content){
          if(err) throw err;

          var directives = content.split("\n").filter(function(line){
            return line.trim();
          }).map(function(line){
            return {
              action: line[0],
              detail: line.slice(2)
            }
          });

          exports.runDirectives(directives, p(range) , p(to), function(){

            async.series([
              function(done){
                exports.checksum(p(to),done);
              },
              function(done){
                exports.checksum(p(from_origin),done);
              },
              function(done){
                debug('request',checksumpath)
                request(app).get( checksumpath ).end(function(err,res){
                  done(null,res.text);
                });
              }
            ],function(err,results){
              if(err){return done(err);}
              done(null,results);
            });

          });

        });
      });
    });
  });
}
