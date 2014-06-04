var chai = require('chai');
var expect = chai.expect;
chai.should()


var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var async = require('async');
var express = require('express');
var request = require('supertest');
var utils = require('./lib/utils');
var mkdirp = require('mkdirp');

var shrinkpacker = require('../lib/middleware').dynamic;

var app = express();
app.use('/zip',shrinkpacker({
    root: path.join(__dirname,"fixtures","mod"),
    pack: path.join(__dirname,"fixtures","zip")
}));

app.use(function(req,res){
    res.send(404,"not found");
});

describe('app',function(){

  beforeEach(function(done){
    fse.remove(path.join(__dirname,'tmp'),done);
  });

  it('full',function(done){
    request(app)
      .get('/zip/a/0.1.0.zip')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });

  it('patch',function(done){
    utils.verifyPatch(app,'a@0.1.0~0.1.1',function(err,checksums){
      if(err){throw err;}
      expect(checksums[0]).to.equal(checksums[1]);
      expect(checksums[1]).to.equal(checksums[2]);
      done();
    });
  });


  it('patch min',function(done){
    utils.verifyPatch(app,'a@0.1.0~0.1.1.min',function(err,checksums){
      if(err){throw err;}
      expect(checksums[0]).to.equal(checksums[1]);
      expect(checksums[1]).to.equal(checksums[2]);
      done();
    });
  });
  
  it('another full',function(done){
    request(app)
      .get('/zip/unit-m-weixin/1.12.6.min.zip')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });

  it('another patch min',function(done){
    this.timeout(100000);
    utils.verifyPatch(app,'unit-m-weixin@1.12.6~1.12.7.min',function(err,checksums){
      if(err){throw err;}
      expect(checksums[0]).to.equal(checksums[1]);
      expect(checksums[1]).to.equal(checksums[2]);
      done();
    });
  });


  it('checksum',function(done){
    request(app)
      .get('/zip/a/0.1.0.min-checksum')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.text.length == 32);
        done();
      });
  });

});