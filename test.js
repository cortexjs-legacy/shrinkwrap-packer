var archiver = require('archiver');
var fs = require('fs');

var zipArchive = archiver('zip');
zipArchive.on('error',function(e){
    console.error(e);
});
// console.log(root,sources);
zipArchive.bulk([
  { src: "a/**/*", expand:true, cwd: "/Users/spud/Product/shrinkwrap-packer/test/fixtures/mod/"},
]);

zipArchive.pipe(fs.createWriteStream('/Users/spud/Product/shrinkwrap-packer/test/fixtures/zip.zip'));
zipArchive.finalize();