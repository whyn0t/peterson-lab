var mongoose = require('mongoose');

var studySchema = mongoose.Schema({
    sid: String,
    key: String,
    youTubeId: String,
    instructions: String,
    redirect: String,
    dateTime: {type: Date, default: Date.now()}
});

var Study = mongoose.model('Study', studySchema);

module.exports = Study;