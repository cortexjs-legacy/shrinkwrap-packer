"use strict";
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
var playground = require('cortex-playground');

var shrinkpacker = require('../').middleware;

var app = express();

app.use('/zip', shrinkpacker.static({
  pack: path.join(__dirname, "fixtures", "zip")
}));
app.use('/zip', shrinkpacker.dynamic({
  root: path.join(__dirname, "fixtures", "mod"),
  pack: path.join(__dirname, "fixtures", "zip")
}));

app.use(function(req, res) {
  res.send(404, "not found");
});

describe('app', function() {
  this.timeout(0);

  beforeEach(function(done) {
    async.series([

      function(done) {
        async.map(['tmp', 'fixtures/zip', 'fixtures/mod'], function(name, done) {
          fse.remove(path.join(__dirname, name), done);
        }, done);
      },
      function(done) {
        async.map(["with-shrinkwrap", "with-css-changed", "with-js-modified-added-changed", "without-min"], function(name, done) {
          var moddir = path.join(__dirname, "fixtures", "mod", name);
          playground.resources(name).copy(moddir, done);
        }, done);
      }

    ], done)
  });

  it('full', function(done) {

    function getZip(done) {
      request(app)
        .get('/zip/with-shrinkwrap/0.1.0.zip')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done(null, res);
        });
    }
    async.series([getZip, getZip], function(err, results) {
      ["last-modified", "date", "etag"].forEach(function(header) {
        delete results[0].headers[header];
        delete results[1].headers[header];
      });
      expect(results[0].headers).to.deep.equal(results[1].headers);
      done();
    });

  });

  it('patch', function(done) {
    utils.verifyPatch(app, 'with-shrinkwrap@0.1.0~0.1.1', function(err, checksums) {
      if (err) {
        throw err;
      }
      expect(checksums[0]).to.equal(checksums[1]);
      expect(checksums[1]).to.equal(checksums[2]);
      done();
    });
  });


  it('patch min', function(done) {
    utils.verifyPatch(app, 'with-shrinkwrap@0.1.0~0.1.1.min', function(err, checksums) {
      if (err) {
        throw err;
      }
      expect(checksums[0]).to.equal(checksums[1]);
      expect(checksums[1]).to.equal(checksums[2]);
      done();
    });
  });


  it('patch min without min', function(done) {
    utils.verifyPatch(app, 'without-min@0.0.1~0.0.2.min', function(err, checksums) {
      if (err) {
        throw err;
      }
      expect(checksums[0]).to.equal(checksums[1]);
      expect(checksums[1]).to.equal(checksums[2]);
      done();
    });
  });


  it('checksum', function(done) {
    request(app)
      .get('/zip/with-shrinkwrap/0.1.0.min-checksum')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        expect(res.text.length).to.equal(32);
        done();
      });
  });

});