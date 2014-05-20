var express = require('express');
var shrinkpacker = require('./lib/index.js');
var path = require('path');
var errorhandler = require('errorhandler');

var app = express();
app.use('/mod',express.static('mod'));

app.use(shrinkpacker({
    root: path.join(__dirname,"mod")
}));

app.use(function(req,res){
    res.send(404,"not found");
});
app.use(errorhandler());

app.listen(3000);