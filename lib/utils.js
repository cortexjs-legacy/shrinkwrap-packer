var path = require('path');

exports.contentDisposition = function (filename){
  var ret = 'attachment';
  if (filename) {
    filename = path.basename(filename);
    // if filename contains non-ascii characters, add a utf-8 version ala RFC 5987
    ret = /[^\040-\176]/.test(filename)
      ? 'attachment; filename=' + encodeURI(filename) + '; filename*=UTF-8\'\'' + encodeURI(filename)
      : 'attachment; filename="' + filename + '"';
  }

  return ret;
};