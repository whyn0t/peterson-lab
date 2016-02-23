var jwtauth = require('../services/jwtauth'),
    gdrive = require('../services/googleDrive'),
    mongoose = require('mongoose'),
    Share = mongoose.model('Share');
    //Share = require('../models/share'),

module.exports.controller = function(app){
    var auth = jwtauth.set(app);

    app.post('/api/share', [auth], function(req, res){
        //give permissions to email
        var fileInfo = {
            path: ['eLab']
        }
        gdrive.queueRequest(function(callback){
            gdrive.share(fileInfo, req.body.email, req.body.permission, function(err){
                if (err) {
                    console.log(err);
                } else {
                    var share = new Share(req.body);
                    share.save(function(err){
                        if (err) {
                            console.error(err);
                        } else {
                            res.sendStatus(200);
                            callback();
                        }
                    });
                }
            });
        });
    })

    app.get('/api/getShared', [auth], function(req, res){
        Share.find({}, {"__v": 0}).exec(function(err, result){
            if (err){
                console.error(err);
                res.status(500).send("Mongoose error. See logs.");
            } else {
                res.json(result);
            }
        });
    });

    app.post('/api/unshare', [auth], function(req, res){
        var fileInfo = {
            path: ['eLab']
        }
        gdrive.queueRequest(function(callback) {
            gdrive.unshare(fileInfo, req.body.email, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    Share.findByIdAndRemove(req.body._id, function (err) {
                        if (err) {
                            console.error(err);
                            res.status(500).send("Mongoose error. See logs.");
                        } else {
                            res.sendStatus(200);
                            callback();
                        }
                    });
                }
            });
        });
    });
}