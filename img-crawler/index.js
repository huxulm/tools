/**
 * Created by xulingming on 2017/5/12.
 */
'use strict';
var config = require('./config');
var mongoose = require('mongoose');

var ImageData = require('./persistence/imagedata.model');

// Connect to MongoDB
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection
    .on('connecting', function(){
        console.log("trying to establish a connection to mongo");
    })
    .on('connected', function() {
        console.log("mongodb connection established successfully");
    })
    .on('error', function(err) {
        console.log('connection to mongo failed ' + err);
    })
    .on('disconnected', function() {
        console.log('mongo db connection closed');
    });

if (!config.site_domain) {
    console.log('Have\'t config site domain.');
}

if (!config.site_home) {
    console.log('Have\'t config site home.');
}


var homeUrl = (config.ssl ? 'https://' : 'http://') + config.site_domain + config.site_home;

    // homeUrl = 'http://stackoverflow.com/questions/6095530/maximum-call-stack-size-exceeded-error';

var worldsCrawler = {
    interval: config.interval || 1,
    getSample: homeUrl,
    get: homeUrl,
    preview: 0,
    extractors: [
        {
            selector: 'a',
            callback: function(err, html, url, response){
                console.log('Crawled url:');
                console.log(url);
                // console.log(response); // If you need see more details about request
                if(!err){
                    console.log('result: ' + html);

                    let aHref = html.attr('href');
                    let imgPageUrl = homeUrl.substr(0, homeUrl.lastIndexOf('/')) + '/' + aHref;
                    if (aHref && /.html$/.test(aHref)) {
                        console.log('Image page url:' + imgPageUrl);
                        ImageData.find({url: imgPageUrl, status: 'WAITING'})
                            .then(function (rs) {
                                if (rs && rs.length > 0) {
                                    console.log('已存在');
                                    return false;
                                } else {
                                    return ImageData.create({
                                        url: imgPageUrl,
                                        status: 'WAITING'
                                    });
                                }
                            })
                            .then(function (rs) {
                                if (rs) {
                                    console.log('新增图片任务:' + rs);
                                }
                            })
                            .catch(function (err) {
                                // ignore ?
                            });
                    }
                }else{
                    console.log(err);
                    // forceExit(0);
                }
            }
        }
    ]
};



if (config.parseHome) {
    require('crawler-js')(worldsCrawler);
}

// require('./task').imageDataIteratorTask();

/*require('./task').imageCrawlerJob(null, function (imgData) {
    require('crawler-js').imageCrawler(imgData);
});*/

require('./task').downloadJob();

module.exports = {
    worldCrawler: worldsCrawler,
    imageCrawler: require('./task').imageCrawler
};


/*
 var j = schedule.scheduleJob('42 * * * *', function(){
 console.log('The answer to life, the universe, and everything!');
 });
 */

/**
 * 强制终止进程
 * @param code
 */
function forceExit(code) {
    let exit = 0;
    try {
        exit = new Number(code);
    } catch (e) {
        // ignore
    }
    process.exit( exit || 0);
}
