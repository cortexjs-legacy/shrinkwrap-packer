

module.exports = function(url){
  var basepath = url.slice(1).replace(/\.zip$/,'');
  var splited = basepath.split("/");
  var min = !!basepath.match(/\.min(-checksum)?$/);
  var isChecksum = !!basepath.match(/-checksum$/);
  var moduleName = splited[0];
  var version = splited[1].split("-")[0].replace("\.min","");
  var result;

  function dealVersion(version){
    if(version.match("~")){
      var splited = version.split("~");
      return {
        from: splited[0],
        to: splited[1]
      }
    }else{
      return version;
    }
  }


  result = {
    min: min,
    name: moduleName,
    version: dealVersion(version)
  }

  if(isChecksum){
    result.checksum = true;
  }

  return result;
}
