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
    },function(err,list){
      expect(list).to.deep.equal([ 'a/0.1.0/**/*', 'b/0.0.1/**/*', 'c/0.1.0/**/*' ]);
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

  it('patch version',function(done){
    packer.patchVersionFiles({
      name:"a",
      version:{
        from:"0.1.0",
        to:"0.1.1"
      }
    },function(err,list){
      expect(list).to.deep.equal([
        'a/0.1.1/a.min.js',
        'a/0.1.1/cortex-shrinkwrap.json',
        'a/0.1.1/a3.js',
        'b/0.0.2/**/*',
        'a@0.1.0~0.1.1.txt'
      ]);

      var changelist_path = list.pop();
      var changelist = fs.readFileSync( path.join(__dirname,'fixtures','mod',changelist_path),'utf8' );
      var expect_changelist = fs.readFileSync( path.join(__dirname,'expect',changelist_path),'utf8' );

      expect(changelist).to.equal(expect_changelist);

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
});

