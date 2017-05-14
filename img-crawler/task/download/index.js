/**
 * Download image from nasa.com
 *
 * Created by xulingming on 2017/5/13.
 */
'use strict';

var download = require('download');

/**
 * 图片链接
 *
 * @param url
 */
module.exports = function (url) {
    return download(url, {
        timeout: 1000*60*15
    });
};
