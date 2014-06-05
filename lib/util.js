var path = require('path');

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


exports.iterateMods = function(tree,iterator){
  for (var modname in tree) {
    for(var version in tree[modname]){
      iterator(modname,version);
    }
  }
}
