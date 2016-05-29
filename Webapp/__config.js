var extend      = require('extend');
var fs          = require('fs');
var LocalConfig = {};

// any local changes should be made in ./config.local.js
if (fs.existsSync('./config.local.js')) {
    LocalConfig = require('./config.local.js');
}

module.exports = extend(true, {
    name: 'production' // application stage
}, LocalConfig);