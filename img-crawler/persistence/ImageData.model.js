/**
 * Created by xulingming on 2017/5/12.
 */
'use strict';

var mongoose = require('mongoose');
var mongoose_page = require('mongoose-paginate');

var ImageDataSchema = new mongoose.Schema({

    // 图片源
    url: {
        type: String
    },
    
    src: {
      type: String
    },

    // 图片文件名称, 取url末端
    origin_name: String,

    // 图片大小, 字节数
    size: Number,

    // 图片大小描述, 19M864K32B
    size_desc: String,

    download_start: {
        type: Date
    },

    download_end: {
        type: Date
    },
    
    // 附加信息
    extra: String,

    create_time: {
        type: Date,
        default: Date.now
    },

    modify_time: {
        type: Date,
        default: Date.now
    }
});
ImageDataSchema.plugin(mongoose_page);
module.exports = mongoose.model('ImageData', ImageDataSchema);
