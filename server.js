var express = require('express');
var shrinkpacker = require('./lib/middleware');
var path = require('path');
var fs = require('fs');
var md5 = require('MD5');
var contentDisposition = require('./lib/utils').contentDisposition;

var app = express();
// app.use('/mod',express.static('mod'));
app.use('/zip',function(req,res,next){
  var filepath = path.join(__dirname,"zip",req.path);

  fs.exists(filepath,function(exists){
    if(!exists){return next();}
    if(filepath.match(/\.zip$/)){
      fs.readFile(filepath,function(err,content){
        if(err){return next(err);}
        // TODO: use md5json to get content md5
        res.type('zip');
        res.set('Content-MD5',md5(content));
        res.set('Content-Disposition', contentDisposition(filepath));
        res.send(content);
      });
    }else{
      res.sendfile(filepath);
    }
  });

});
app.use('/zip',shrinkpacker({
    root: path.join(__dirname,"mod"),
    pack: path.join(__dirname,"zip")
}));

app.use(function(req,res){
    res.send(404,"not found");
});

app.listen(3000);

module.exports = app;