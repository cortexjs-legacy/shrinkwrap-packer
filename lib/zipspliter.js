

module.exports = function(req,res,next){

  var p = req.path.slice(1).match(/(.*)\.zip$/)[1];
  var splited = p.split("/");

  var moduleName = splited[0];
  var version = splited[1];
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


  if(moduleName.match(",")){
    var names = moduleName.split(",");
    var versions = version.split(",");
    if(names.length !== versions.length){
      return next();
    }else{
      result = [];
      for(var i = 0; i < names.length ; i++){
        result.push({
          name: names[i],
          version: dealVersion(versions[i])
        });
      }
    }
  }else{
    result = {
      name: moduleName,
      version: dealVersion(version)
    }
  }

  req.zipdefine = result;
  next();
}
