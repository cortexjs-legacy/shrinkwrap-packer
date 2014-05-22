var app = require('../');
var request = require('supertest');



request(app)
  .get('/combo/~a.css,~dir~d.css,~b.css,~dir~c.css')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log(res.headers);
    console.log(res.text);
  });