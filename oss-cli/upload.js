var client = require('./client'),
        conf = require('./client/config'),
	path = require('path-exists'),
	co = require('co');

if(process.argv.length > 2) {
  
  let fileUrl = null;
  process.argv.forEach(val => {
    if (val.indexOf('--file') > -1) {
      fileUrl = val.split('=')[1];
    }
  });
  
  if (fileUrl) {
    console.log('即将上传:' + fileUrl);
    if (path.sync(fileUrl)) {
      co(function* () {
        client.useBucket(conf.bucket);
        var result = yield client.put('oss-id-' + new Date().getTime(), fileUrl);
        console.log('文件上传成功:\n' + JSON.stringify(result));
      })
      .catch(function (err) {
        console.log('文件上传失败:\n');
        console.log(err);
      });  
    }
  } else {
    console.log('文件不存在:' + fileUrl || '');
  }

} else {
  console.log('Haven\'t indict one arg <--file=[uri]>');
  process.exit(0);	
}
