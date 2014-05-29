var express = require('express');
var shrinkpacker = require('./lib/middleware');
var path = require('path');

var app = express();
// app.use('/mod',express.static('mod'));
app.use('/zip',shrinkpacker.static({
  pack: path.join(__dirname,"zip")
}));
app.use('/zip',shrinkpacker.dynamic({
    root: path.join(__dirname,"mod"),
    pack: path.join(__dirname,"zip")
}));

app.use(shrinkpacker.errorHandler);

app.listen(3000);

module.exports = app;