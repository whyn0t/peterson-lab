var mongoose = require('mongoose');

var shareSchema = mongoose.Schema({
    name: String,
    email: String,
    permission: String
});

module.exports = mongoose.model('Share', shareSchema);