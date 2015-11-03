var jwtauth = require('../services/jwtauth'),
    Share = require('../models/share'),
    drive = require('../services/googleDrive'),
    AWS = require('aws-sdk');

module.exports.controller = function(app){
    var auth = jwtauth.set(app);
    AWS.config.loadFromPath('AWSconfig.json');
    //TODO load bucket name from some config file
    var s3Bucket = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {
            Bucket: 'peterson-elab'
        }
    });

    app.get('/api/getStimuli', [auth], function(req, res){
        s3Bucket.listObjects({}, function(err, data){
            if (err) {
                console.error(err);
                return;
            } else {
                res.json(data.Contents);
            }
        })
    });
}