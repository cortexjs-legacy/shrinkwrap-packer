var chai = require('chai');
var expect = chai.expect;
chai.should()


var fs = require('fs');
var path = require('path');
var async = require('async');
var express = require('express');
var request = require('supertest');


var shrinkpacker = require('../lib/middleware');

var app = express();
app.use('/zip',shrinkpacker({
    root: path.join(__dirname,"fixtures","mod"),
    pack: path.join(__dirname,"fixtures","zip")
}));

app.use(function(req,res){
    res.send(404,"not found");
});

describe('app',function(){

  it('normal',function(done){
    request(app)
      .get('/zip/a/0.1.0.zip')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });

  // it('diff-patch',function(){

  // });

  // it('batch',function(){

  // });

});