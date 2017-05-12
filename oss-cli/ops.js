var client = require('./client'),
      conf = require('./client/config'),
        co = require('co'),
      argv = process.argv.slice(2);

var apis = {

  // 获取Bucket列表
  getBucketList: function() {
     return co(function* () {
       var result = yield client.listBuckets({
        'max-keys': 5
        });
       return yield Promise.resolve(result);
    });
  }
};

if(argv && argv.length > 0) {
 if(argv[0].indexOf('--opt') == -1) {
   help();
   process.exit(0);
 } else {
   switch(argv[0].split('=')[1]) {
     case 'b': 
     case 'B':
       apis.getBucketList(argv[1])
       .then(rs => {
         console.log('Get BuckeList Result:\n' + 
           JSON.stringify(rs)
         );
       })
       .catch(err => {
         throw err;
       });
     break; 
     default:
       console.log('Unsupported opts argv.');
       break; 
   }  
 }   
} else {
  help();
  process.exit(0); 
}

function help() {
  process.stdout.write(
    "Usage: \n" +
    "Options:\n" +
    "--opt			[Must]\n" +
    "	e.g.\n" +
    "	--opt=b\n"
  ); 
}

module.exports = apis;
