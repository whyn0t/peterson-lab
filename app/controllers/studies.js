var jwtauth = require('../services/jwtauth'),
    drive = require('../services/googleDrive'),
    Study = require('../models/study'),
    Session = require('../models/session');

module.exports.controller = function(app){
    var auth = jwtauth.set(app);

    app.get('/api/getStudies', [auth], function(req, res){
        Study.find({}, {"__v": 0}).exec(function(err, result){
            if (err){
                console.error(err);
                res.status(500).send("Mongoose error. See logs.");
            } else {
                res.json(result);
            }
        });
    });

    app.post('/api/removeStudy', [auth], function(req, res){
        console.log("Starting delete");
        drive.deleteFile(req.body.studyId, null, function(err) {
            if (err){
                console.error("Gdrive : ", err);
                res.status(500).send("Gdrive error. See logs.");
                return;
            } else {
                console.log("Gdrive delete successful");
                Study.findByIdAndRemove(req.body._id, function (err, result) {
                    if (err) {
                        console.error("Mongoose : ", err);
                        res.status(500).send("Mongoose error. See logs.");
                    } else {
                        res.sendStatus(200);
                    }
                });
                Session.find({studyId: req.body.studyId}).remove(function (err) {
                    if (err) {
                        console.error("Mongoose : ", err);
                        res.status(500).send("Mongoose error. See logs.");
                    }
                });
            }
        });
    });

    app.post('/api/newStudy', [auth], function(req, res){
        var study = new Study(req.body);
        console.log(req.body);
        study.save(function (err) {
            if (err) {
                console.error(err);
                res.status(500).send("Mongoose error. See logs.");
            } else {
                res.sendStatus(200);
            }
        });
    });
}