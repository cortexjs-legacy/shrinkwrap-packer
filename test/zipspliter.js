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
      min: false,
      name: "a",
      version: "0.1.0"
    });
  });

  it('single range', function () {
    build('/a/0.1.0~0.1.2.zip',{
      min: false,
      name: "a",
      version: {
        from: "0.1.0",
        to: "0.1.2"
      }
    });
  });

  it('range with prerelease', function () {
    build('/a/0.1.0-beta~0.1.2.zip',{
      min: false,
      name: "a",
      version: {
        from: "0.1.0-beta",
        to: "0.1.2"
      }
    });
  });


  it('checksum', function () {
    build('/a/0.1.0-checksum',{
      min: false,
      name: "a",
      version: "0.1.0",
      checksum: true
    });
  });



  it('min', function () {
    build('/a/0.1.0~0.1.2.min.zip',{
      min: true,
      name: "a",
      version: {
        from: "0.1.0",
        to: "0.1.2"
      }
    });
  });



  it('invalid url', function () {
    build('/a/0.1.0~0.1.2.min-checksumeaqweqweq', false);
    build('/mbox/0.1.1.min-checksume', false);
    build('/a/qidqwoiqwqweqwe', false);
    build('/a/0.1.0~0.1.9-checksum', false);
    build('/a/0.1.0~0.1.1', false);
    build('/a/0.1.0~0.1.a', false);
    build('/a', false);
    build('/', false);
  });
});