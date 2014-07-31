var express = require('express');
var shrinkpacker = require('./lib/middleware');
var path = require('path');
var config = require('config');

var app = express();

var CACHE = config.get("cache");
var PACKPATH = config.get("packpath");
var ROOTPATH = config.get("rootpath");
var PORT = config.get("port");

if(CACHE){
  app.use('/zip', shrinkpacker.static({
    cache: CACHE,
    pack: PACKPATH
  }));
}
app.use('/zip', shrinkpacker.dynamic({
  root: ROOTPATH,
  pack: PACKPATH,
  cache: CACHE
}));

app.use(shrinkpacker.errorHandler);

app.listen(PORT);