var Packer = require('../lib/index');
var path = require('path');
var chai = require('chai');

expect = chai.expect;
chai.should();


var packer = new Packer({
  root: path.join(__dirname,'fixtures','mod')
});


describe('get file list',function(){
  it('full version',function(){
    packer.fullVersionFiles({
      name:"a",
      version:"0.1.0"
    },function(err,list){
      expect(list).to.deep.equal([ 'a/0.1.0/**/*', 'b/0.0.1/**/*', 'c/0.1.0/**/*' ]);
    });
  });

  it('full version without shrinkwrap',function(){
    packer.fullVersionFiles({
      name:"b",
      version:"0.0.3"
    },function(err,list){
      expect(err).to.not.be.null;
    });
  });

  it('patch version',function(){
    packer.patchVersionFiles({
      name:"a",
      version:{
        from:"0.1.0",
        to:"0.1.1"
      }
    },function(err,list){
      expect(list).to.deep.equal([
        'a/0.1.1/a.js',
        'a/0.1.1/a.min.js',
        'a/0.1.1/cortex-shrinkwrap.json',
        'b/0.0.2/b.js',
        'b/0.0.2/b.min.js'
      ]);
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
});

