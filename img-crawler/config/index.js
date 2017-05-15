/**
 * Created by xulingming on 2017/5/12.
 */
'use strict';

module.exports = require('./config.json') || {

        ssl: process.env.SSL || true,
        site_domain: process.env.SITE_DOMAIN || 'apod.nasa.gov',
        site_home: process.env.SITE_HOME || '/apod/archivepix.html',

        interval: 1000,

        // MongoDB connection options
        mongo: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost/image-crawler'
        },

        parseHome: false,

        parseDetail: false,

        taskCorn: '* 0,30 * * * *',

        downLoadDestination: '/Users/xulingming/Public/docs_private/space_imgs',

        downloadCorn: '0,15,30,45 * * * * *'
};
