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
  this.timeout(0);
  it('full version',function(done){
    packer.fullVersionFiles({
      name:"with-shrinkwrap",
      version:"0.1.0"
    },function(err,result){
      if(err){return done(err);}
      expect(result.sources).to.deep.equal([ 'with-shrinkwrap/0.1.0/**/*', 'with-js-modified-added-changed/0.1.0/**/*', 'with-css-changed/0.0.1/**/*' ]);
      done();
    });
  });

  it('full version without shrinkwrap',function(done){
    packer.fullVersionFiles({
      name:"with-css-changed",
      version:"0.0.3"
    },function(err,list){
      expect(err).to.not.be.null;
      done();
    });
  });

  it('patch version',function(done){
    packer.patchVersionFiles({
      name:"with-shrinkwrap",
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
      name:"with-shrinkwrap",
      version:{
        from:"0.1.0",
        to:"0.1.9"
      }
    },function(err,list){
      expect(err).to.not.be.null;
    });
  });

});

