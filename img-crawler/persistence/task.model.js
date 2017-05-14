/**
 * Created by xulingming on 2017/5/12.
 */
'use strict';

var mongoose = require('mongoose');
var mongoose_page = require('mongoose-paginate');

/**
 * 下载任务
 */
var TaskSchema = new mongoose.Schema({
    
    // 图片数据id
    img_data_id: {type: mongoose.Schema.Types.ObjectId, ref: 'ImageData'},
    
    // 任务状态, WAIT, DOWNLOADING, COMPLETED
    status: String,
    
    // 重试次数
    retry_times: {
        type: Number,
        default: 0
    },
    
    create_time: {
        type: Date,
        default: Date.now
    },
    
    modify_time: {
        type: Date,
        default: Date.now
    }
});
TaskSchema.plugin(mongoose_page);
module.exports = mongoose.model('Task', TaskSchema);
