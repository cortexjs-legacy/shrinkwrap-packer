var zipspliter = require('../lib/zipspliter');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


chai.should();


describe('splite', function () {

  function build(url,result){
    var req = {path: url};
    var res = {};
    var next = function(){
      expect(req.zipdefine).to.deep.equal(result);
    };

    zipspliter(req,res,next);
  }


  it('single zip', function () {
    build('/a/0.1.0.zip',{
      name: "a",
      version: "0.1.0"
    });
  });

  it('single range', function () {
    build('/a/0.1.0~0.1.2.zip',{
      name: "a",
      version: {
        from: "0.1.0",
        to: "0.1.2"
      }
    })
  });

  it('multi zip', function(){
    build('/a,b/0.1.0,0.2.3.zip',[{
      name: "a",
      version: "0.1.0"
    },{
      name: "b",
      version: "0.2.3"
    }]);
  });

  it('multi range', function () {
    build('/a,b/0.1.0~0.1.2,0.1.0~0.2.3.zip',[{
      name: "a",
      version: {
        from: "0.1.0",
        to:"0.1.2"
      }
    },{
      name: "b",
      version: {
        from: "0.1.0",
        to: "0.2.3"
      }
    }]);
  });


});