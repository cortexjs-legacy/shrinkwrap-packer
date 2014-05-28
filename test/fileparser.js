var Packer = require('../lib/index');
var path = require('path');
var fs = require('fs');
var chai = require('chai');

expect = chai.expect;
chai.should();


var packer = new Packer({
  root: path.join(__dirname,'fixtures','mod')
});


describe('get file list',function(){
  it('full version',function(done){
    packer.fullVersionFiles({
      name:"a",
      version:"0.1.0"
    },function(err,result){
      expect(result.sources).to.deep.equal([ 'a/0.1.0/**/*', 'b/0.0.1/**/*', 'c/0.1.0/**/*' ]);
      done();
    });
  });

  it('full version without shrinkwrap',function(done){
    packer.fullVersionFiles({
      name:"b",
      version:"0.0.3"
    },function(err,list){
      expect(err).to.not.be.null;
      done();
    });
  });

  it('version map', function () {
    var result = Packer.versionMap([{
      name:"a",
      version:"0.1.0"
    },{
      name:"b",
      version:"0.0.1"
    },{
      name:"b",
      version:"0.0.2"
    }]);
    expect(result).to.deep.equal({
      "a":["0.1.0"],
      "b":["0.0.1","0.0.2"]
    });
  });

  it('min version', function(){
    var result = Packer.minVersion(["0.3.1","0.5.0","0.2.7"]);
    expect(result).to.equal("0.2.7");
  });

  it('extend files', function(done){
    packer.extend({name:"a",version:"0.1.0"},function(err,result){
      expect(result.list).to.deep.equal({
        'a/0.1.0/a.js': '1c97c94d65b5ee26a3a420f0969af89b',
        'a/0.1.0/a2.js': 'e9f5f2f40b131ce97751f73152df16ab',
        'a/0.1.0/cortex-shrinkwrap.json': 'bb4c06e57e2a0ca5dd7421eaae2547ec',
        'c/0.1.0/c.js': '21e63e1ee19b359bd6b310420f1df9c8',
        'c/0.1.0/c.min.js': 'bc2eae9c607118df6c9e01036d4a3004',
        'a/0.1.0/a.min.js': '00a22cc4d61447ab905b541420fdaaab',
        'b/0.0.1/b.js': '656ad21ad877025a82411b49aa0f8b88',
        'b/0.0.1/b.min.js': '20db73442ad8b3838d1936ae8d5b0166'
      });
      done();
    });
  });

  it('patch version',function(done){
    packer.patchVersionFiles({
      name:"a",
      version:{
        from:"0.1.0",
        to:"0.1.1"
      }
    },function(err,result){
      done();
    });
  });


  it('patch version without shrinkwrap',function(){
    packer.patchVersionFiles({
      name:"a",
      version:{
        from:"0.1.0",
        to:"0.1.9"
      }
    },function(err,list){
      expect(err).to.not.be.null;
    });
  });

  it('checksum',function(){
    packer.checksum({
      name:"a",
      version:"0.1.0"
    })
  })
});

