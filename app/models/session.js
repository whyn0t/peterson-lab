var mongoose = require('mongoose');

var sessionSchema = mongoose.Schema({
    sid: String,
    pid: Number,
    startTime: {type: Date, default: Date.now()},
    endTime: Date,
    started: Boolean
});

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;