var path = require('path');
var glob = require('glob');
var async = require('async');
var md5 = require('./md5');
var util = require('./util');
var fs = require('fs');

exports.folder = function(folder, done) {
  var list = {};
  glob('**/*', {
    cwd: folder,
    mark: true
  }, function(err, matches) {
    if (err) {
      return done(err);
    }
    matches = matches.filter(function(item) {
      return !item.match(/\/$/);
    });
    async.map(matches, function(item, done) {
      fs.readFile(path.join(folder, item), function(err, content) {
        if (err) {
          return done(err);
        }
        list[item] = md5(content);
        done(null);
      });
    }, function(err) {
      if (err) {
        return done(err);
      }
      exports.generate(list, done);
    });
  });
}

exports.generate = function(list, done) {
  console.log(list);
  var arr = [];
  for (var filepath in list) {
    arr.push(md5(filepath) + list[filepath]);
  }
  done(null, md5(arr.sort().join('')));
}

exports.tree = function(tree, done) {
  var list = {};
  util.iterateMods(tree, function(name, version) {
    var mod = tree[name][version];
    for (var filepath in mod) {
      list[path.join(name, version, filepath)] = mod[filepath];
    }
  });
  exports.generate(list, done);
}