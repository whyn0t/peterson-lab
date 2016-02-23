var jwtauth = require('../services/jwtauth'),
    drive = require('../services/googleDrive'),
    mongoose = require('mongoose'),
    Study = mongoose.model('Study'),
    Session = mongoose.model('Session'),
    flakeIdGen = require('flake-idgen'),
    intformat = require('biguint-format'),
    generator = new flakeIdGen;

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
        Study.findByIdAndRemove(req.body._id, function (err, result) {
            if (err) {
                console.error("Mongoose : ", err);
                res.status(500).send("Mongoose error. See logs.");
            } else {
                Session.find({sid: req.body.sid}).remove(function (err) {
                    if (err) {
                        console.error("Mongoose : ", err);
                        res.status(500).send("Mongoose error. See logs.");
                    } else {
                        res.sendStatus(200);
                    }
                });
            }
        });
        var fileInfo = {
            path: ["eLab", "avData"],
            title: req.body.sid
        };
        drive.queueRequest(function(callback){
            drive.deleteFile(fileInfo, function(err) {
                if (err){
                    console.error("Gdrive | ", err);
                    return;
                } else {
                    callback();
                }
            });

        });
    });

    app.post('/api/newStudy', [auth], function(req, res){
        req.body.key = intformat(generator.next(), 'dec');  //generate study key
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