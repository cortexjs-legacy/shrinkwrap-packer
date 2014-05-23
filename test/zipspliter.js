var zipspliter = require('../lib/zipspliter');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


chai.should();


describe('splite', function () {

  function build(url,result){
    expect(zipspliter(url)).to.deep.equal(result);
  }


  it('single zip', function () {
    build('/a/0.1.0.zip',{
      name: "a",
      version: "0.1.0",
      single:false
    });
  });

  it('standalone zip', function () {
    build('/a/0.1.0-single.zip',{
      name: "a",
      version: "0.1.0",
      single:true
    });
  });

  it('single range', function () {
    build('/a/0.1.0~0.1.2.zip',{
      name: "a",
      version: {
        from: "0.1.0",
        to: "0.1.2"
      },
      single:false
    })
  });

  it('multi zip', function(){
    build('/a,b/0.1.0,0.2.3.zip',[{
      name: "a",
      version: "0.1.0",
      single:false
    },{
      name: "b",
      version: "0.2.3",
      single:false
    }]);
  });

  it('multi range', function () {
    build('/a,b/0.1.0~0.1.2,0.1.0~0.2.3.zip',[{
      name: "a",
      version: {
        from: "0.1.0",
        to:"0.1.2"
      },
      single:false
    },{
      name: "b",
      version: {
        from: "0.1.0",
        to: "0.2.3"
      },
      single:false
    }]);
  });


});