var mongoose = require('mongoose');

var appDataSchema = mongoose.Schema({
    appKey: String,
    adminUser: String,
    adminPassword: String
});

var AppData = mongoose.model('AppData', appDataSchema);

module.exports = AppData;