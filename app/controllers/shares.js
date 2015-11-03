var jwtauth = require('../services/jwtauth'),
Share = require('../models/share'),
shareData = require('../services/googleDrive').share,
unshareData = require('../services/googleDrive').unshare,
mkDir = require('../services/googleDrive').mkDir;

module.exports.controller = function(app){
    var auth = jwtauth.set(app);

    app.post('/api/share', [auth], function(req, res){
        //give permissions to email
        mkDir({path: ['eLab']}, function(err){
            if (err) {
                console.error(err);
                res.status(500).send("Gdrive error. See logs.")
            } else {
                shareData('eLab', req.body.email, req.body.permission, function(err){
                    if (err) {
                        console.log(err);
                        res.sendStatus(500).send("Gdrive error. See logs.")
                    } else {
                        var share = new Share(req.body);
                        share.save(function(err){
                            if (err) {
                                console.error(err);
                                res.status(500).send("Mongoose error. See logs.")
                            } else {
                                res.sendStatus(200);
                            }
                        })
                    }
                });
            }
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
        unshareData('eLab', req.body.email, function(err) {
            if (err) {
                console.error(err);
                res.status(500).send("Gdrive error. See logs.");
            } else {
                Share.findByIdAndRemove(req.body._id, function (err) {
                    if (err) {
                        console.error(err);
                        res.status(500).send("Mongoose error. See logs.");
                    } else {
                        res.sendStatus(200);
                    }
                });
            }
        });
    });
}