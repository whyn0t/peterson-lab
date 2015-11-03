var mongoose = require('mongoose');

var sessionSchema = mongoose.Schema({
    studyId: String,
    partId: Number,
    stopTime: Number,
    response: String,
    dateTime: {type: Date, default: Date.now()}
});

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;