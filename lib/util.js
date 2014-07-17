var path = require('path');
var fs = require('fs');

exports.toGlob = function(mod) {
  var dir = path.join(mod.name, mod.version);
  return path.join(dir, "**", "*");
}

exports.filterObject = function (object, filter) {
  var result = {};
  for (var key in object) {
    if (filter(key)) {
      result[key] = object[key];
    }
  }
  return result;
}

exports.moduleExists = function(root, module, done){
  var dir = path.join(root, module.name, module.version);
  var moduleId = module.name + "@" + module.version;
  fs.exists(dir, function(exists){
    if(!exists){
      return done({
        code: 404,
        message: "Module " + moduleId + " Not Found"
      });
    }

    done(null);
  });
}

exports.iterateMods = function(tree,iterator){
  for (var modname in tree) {
    for(var version in tree[modname]){
      iterator(modname,version);
    }
  }
}
