/**
 * Download image from nasa.com
 *
 * Upload image to oss on aliyun.com
 *
 * Created by xulingming on 2017/5/13.
 */
'use strict';
var mongoose = require('mongoose'),
    Promise = mongoose.Promise = require('bluebird'),
    ImageData = require('../persistence/imagedata.model'),
    Task = require('../persistence/task.model'),
    task = null,
    scheduler = require('node-schedule'),
    config = require('../config'),
    crawler = require('crawler-js'),
    fs = require('fs');

var imageCrawlerJob = function (con, callback) {

    // 遍历Task document,执行图片下载
    return promiseFor(function (val) { // condition
        return val.hasNext
    }, function (val) { // action
        return Task.paginate(con || {
            status: 'WAIT',
            retry_times: {
                $lt: 5
            }
        }, {
            page: (val.rs.page || 0) + 1,
            limit: 1
        }).then(function (rs) {
            if (rs && rs.docs) {
                // console.log('Task:', rs.docs);
                rs.docs.forEach(task => {
                    if (task && task.img_data_id) {
                        ImageData.find({_id: task.img_data_id})
                            .then(imgData => {
                                // 耗时操作
                                try {
                                    callback(imgData[0]);
                                } catch (err) {
                                    console.log('图片详情页面爬取发生错误.', err);
                                }
                            })
                            .catch(err => {
                               console.log('任务关联图片数据不存在.', err);
                            });
                    }
                });
                return {hasNext: val.rs.page < rs.pages - 1, rs: rs};
            } else {
                return {hasNext: false};
            }
        }).catch(function (err) {
            console.log("遍历Task发生错误", err);
            return {hasNext: false};
        });

    }, {    // initial iterator value
        hasNext: true,
        rs: {
            page: 0
        }
    });
};

var promiseFor = Promise.method(function(condition, action, value) {
    if (!condition(value)) return value;
    return action(value).then(promiseFor.bind(null, condition, action));
});

var imageDataIteratorTask = function () {

    promiseFor(function(val) {
        return val.hasNext;
    }, function(val) {
        return ImageData.paginate({}, {
            page: (val.rs.page || 0) + 1,
            limit: 10
        }).then(function (rs) {
            if (rs && rs.docs) {
                console.log('ImageData:', rs.docs);
                rs.docs.forEach(function (e) {
                    // 创建任务
                    Task.find({
                        img_data_id: e._id
                    }).then(function (tasks) {
                        if (tasks.length < 1) { // 当前ImageData没有任务,创建任务
                            Task.create({
                                img_data_id: e._id,
                                retry_times: 0,
                                status: 'WAIT'
                            })
                                .then(function (nwTask) {
                                    console.log('创建下载任务成功.Task Id:%s', nwTask._id);
                                })
                                .catch(function (err) {
                                    console.log('创建下载任务失败.', err);
                                });
                        } else {
                            console.log('当前ImageData[%s]已存在下载任务[%s]', e._id, tasks);
                        }
                    }).catch(function (err) {
                        console.log('查询下载任务发生错误.', err);
                    });
                });

                return {hasNext: val.rs.page < rs.pages - 1, rs: rs};
            } else {
                return {hasNext: false};
            }
        }).catch(function (err) {
            console.log('Iterator image data error. curPage=%s, err=%s', val.page, err);
            return {hasNext: false};
        });
    }, {hasNext: true, rs: {page: 0}}).then(console.log.bind(console, 'all done'));
};

var imageCrawler = function (imgData) {
    console.log('Image Data:' + JSON.stringify(imgData));
    return {
        interval: config.interval || 10000,
        get: imgData.url,
        getSample: imgData.url,
        extractors: [
            {
                selector: 'html center p a',
                callback: function(err, html, url, response){
                    console.log('Crawled url:' + JSON.stringify(url));
                    // console.log('result: ' + html); // If you need see more details about request
                    if(!err){
                        let href = html.attr('href');
                        if (href && /(.png|.jpg|.jpeg|.gif|.png)$/.test(href)) {
                            href = imgData.url.substr(0, imgData.url.lastIndexOf('/') + 1) + href;
                            console.log('Href ' + href);
                            ImageData.find({
                                url: imgData.url
                            }).then(function (rs) {
                                if (rs && rs.length > 0) {
                                    rs[0].src = href;
                                    rs[0].modify_time = new Date();
                                    rs[0].save()
                                        .then(function (rs) {
                                            if (rs) {
                                                console.log('update image src success', rs._id);
                                            }
                                        })
                                        .catch(function (err) {
                                            console.log('update image src err.', err);
                                        });
                                }
                            })
                        }
                    }else{
                        console.log('错误:' + err);
                    }
                }
            }
        ]
    };
};

var downloadJboQueue = [];
var downloadJob = function () {
  imageCrawlerJob(null, function (imgData) {
      let url = imgData.src;
      if (!url) {
          return;
      }
      addDownloadTask(imgData);
  }).then(function (val) {
      console.log('任务队列创建成功, queue length:' + downloadJboQueue.length);

      // 20s once
      var rs = scheduler.scheduleJob('0,30 * * * * *', function () {
          console.log('开始调度');
          let task = downloadJboQueue.pop();
          if (task) {
              console.log('开始下载[%s]:', Date.now(), task);
              executor(task).then(function (data) {
                  if (!data) {
                      return;
                  }
                  let url = task.src;
                  try {
                      if (!fs.writeFileSync(config.downLoadDestination + url.substr(url.lastIndexOf('/')), data)) {
                          console.log('文件保存成功');
                          return Task.find({
                              img_data_id: task._id
                          }).then(function (rs) {
                              if (rs) {
                                  rs[0].status = 'COMPLETED';
                                  rs[0].modify_time = new Date();
                                  rs[0].save().then(function (rs) {
                                      console.log('下载任务状态更新成功.');
                                      return true;
                                  }).catch(function (err) {
                                      console.log('下载任务状态更新失败.', err);
                                      downloadJboQueue.unshift(task);
                                      return false;
                                  });
                                  return true;
                              }
                          }).catch(function (err) {
                              console.log('下载任务状态更新失败.', err);
                              downloadJboQueue.unshift(task);
                              return false;
                          });
                      }
                  } catch (err) {
                      console.log('文件保存失败.', err);
                      downloadJboQueue.unshift(task);
                      return false;
                  }
              })
                  .catch(function (err) {
                      console.log('下载' + url + '失败:', err);
                      downloadJboQueue.unshift(task);
                      return false;
                  });
          }
      });
  }).catch(function (err) {
      console.log('任务队列创建失败.', err);
  });
};

function executor(imgData) {
    let url = imgData.src;
    if (!url) {
        return Promise.resolve(false);
    }
    return require('./download')(imgData.src);
}


function addDownloadTask(imgData) {
    downloadJboQueue.push(imgData);
}

// 创建新Task
// 1. image data 没有任务
// 2. image data 任务失败 && retry_times < 5

module.exports = {
        imageDataIteratorTask: imageDataIteratorTask,
        imageCrawlerJob: imageCrawlerJob,
        downloadJob: downloadJob,
        imageCrawler: imageCrawler,
        run: function () {
            scheduler.scheduleJob(config.taskCorn, imageDataIteratorTask || function () {
                    console.log('Empty job.');
                });

            scheduler.scheduleJob(config.taskCorn, imageCrawlerJob || function () {
                    console.log('Empty job.');
                });
        }
};
