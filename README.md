# shrinkwrap-packer [![NPM version](https://badge.fury.io/js/shrinkwrap-packer.svg)](http://badge.fury.io/js/shrinkwrap-packer) [![Build Status](https://travis-ci.org/cortexjs/shrinkwrap-packer.svg?branch=master)](https://travis-ci.org/cortexjs/shrinkwrap-packer) [![Dependency Status](https://gemnasium.com/cortexjs/shrinkwrap-packer.svg)](https://gemnasium.com/cortexjs/shrinkwrap-packer)

Shrinkwrap server for cortex


## Server
```js
    var app = express();
    // app.use('/mod',express.static('mod'));
    app.use('/zip',shrinkpacker.static({
      pack: path.join(__dirname,"zip")
    }));
    app.use('/zip',shrinkpacker.dynamic({
        root: path.join(__dirname,"mod"),
        pack: path.join(__dirname,"zip")
    }));

    app.use(function(err,req,res,next){
        console.error(err.stack);
        res.send(404,"not found");
    });
```

### Configurations
    
`root`: module root directory for cortex
`pack`: zip package root directory

## File Structure

```
/root
    |-- a
        |-- 0.1.0
            |-- a.js
            |-- cortex-shrinkwrap.json
        |-- 0.1.2
            |-- b.js
        ...
```

### Routes

#### full package

`/zip/a/0.1.0.zip`: full package zip

the zip file will contains self and all it's packages


#### patch package

`/zip/a/0.1.0~0.1.1.zip`

```
/a/0.1.0/afile.js
/a/0.2.0/bfile.js
/c/0.3.0/cfile.js
directives.txt
```

### directives
- R rename one origin file to another
- C copy one origin file to another 
- M modified, use patch version to cover origin one
- A add new file from patch folder
- D remove from origin folder

### checksum

`/zip/a/0.1.0-checksum`: checksum of the final folder

```js
md5( [ md5(relpath1) + md5(filecontent1), md5(relpath2) + md5(filecontent2), ... ].sort().join('') )
```

### min file
`/zip/a/0.1.0.min-checksum`
`/zip/a/0.1.0~0.1.1.min.zip`
`/zip/a/0.1.1.min.zip`
will filter files ends with `.min`
or will filter files that **not** ends with `.min`

### zip header
    Content-MD5: <md5 of zip file>

