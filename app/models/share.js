var mongoose = require('mongoose');

var shareSchema = mongoose.Schema({
    name: String,
    email: String,
    permission: String
});

var Share = mongoose.model('Share', shareSchema);

module.exports = Share;