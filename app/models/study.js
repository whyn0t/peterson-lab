var mongoose = require('mongoose');

var studySchema = mongoose.Schema({
    studyId: String,
    partIdMin: Number,
    partIdMax: Number,
    stimulusTitle: String,
    stimulusUrl: String,
    instructions: String,
    active: Boolean,
    dateTime: {type: Date, default: Date.now()}
});

var Study = mongoose.model('Study', studySchema);

module.exports = Study;