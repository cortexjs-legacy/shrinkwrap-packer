var request = require('request');
var fse = require('fs-extra');
var async = require('async');

// fse.remove('zip',function(){

  async.times(5, function(n, done){
    var start = +new Date();
    request('http://localhost:3000/zip/a/0.1.0-checksum',function(err,resp,body){
      if(err){
        // console.log(err);
      }else{
        console.log(n,body);
      }
      console.log('spend:', (+new Date) - start + 'ms');
      done(err,body);
    });
  }, function(err, results) {
  });

// });