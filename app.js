var express = require('express');
var shrinkpacker = require('./lib/middleware');
var path = require('path');

[{
  root: path.join(__dirname,"..","alpha"),
  port: 3000
},{
  root: path.join(__dirname,"..","beta"),
  port: 3001
}].forEach(function(item){
  var app = express();
  var root = item.root;
  var port = item.port;
  // app.use('/mod',express.static('mod'));
  app.use('/zip',shrinkpacker.static({
    pack: path.join(root,"static","zip")
  }));
  app.use('/zip',shrinkpacker.dynamic({
      root: path.join(root,"static","mod"),
      pack: path.join(root,"static","zip")
  }));

  app.use(shrinkpacker.errorHandler);

  app.listen(port);
});