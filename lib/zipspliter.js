var semver = require('semver');

module.exports = function(url){
  var isChecksum = !!url.match(/-checksum$/);
  var isZip = !!url.match(/\.zip$/);
  if(!isZip && !isChecksum){return false;}

  var basepath = url.slice(1).replace(/\.zip$/,'');
  var splited = basepath.split("/");
  var min = !!basepath.match(/\.min(-checksum)?$/);
  var moduleName = splited[0];
  var version = splited[1].split("-")[0].replace("\.min","");
  var result;

  function dealVersion(version){
    if(!version){return false;}
    if(version.match("~")){
      var splited = version.split("~");
      var from = splited[0];
      var to = splited[1];
      if(!semver.valid(from) || !semver.valid(to) || isChecksum){
        return false;
      }else{
        return {
          from: splited[0],
          to: splited[1]
        }
      }
    }else{
      return semver.valid(version);
    }
  }

  version = dealVersion(version);
  if(!version){return false;}

  result = {
    min: min,
    name: moduleName,
    version: version
  }

  if(isChecksum){
    result.checksum = true;
  }

  return result;
}
