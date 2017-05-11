var co = require('co'),
    OSS = require('ali-oss'),
    conf = require('./config');
var client = new OSS({
  region: conf.region,
  accessKeyId: conf.accessKeyId,
  accessKeySecret: conf.accessKeySecret
});

module.exports = client; 
