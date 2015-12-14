//TODO better way to do path?
var Study = require('../../models/study'),
    Session = require('../../models/session'),
    jwt = require('jwt-simple'),
    moment = require('moment');

module.exports.controller = function(app) {

    //TODO change to /api/auth/admin
    app.post('/api/auth', function (req, res) {
        console.log(req.body);
        if (req.body.username == 'admin' && req.body.password == 'petersonlab1!') {
            var expires = moment().add('hours', 16).valueOf();
            var token = jwt.encode({
                iss: req.body.username,
                exp: expires
            }, app.get('jwtTokenSecret'));

            res.json({
                token: token,
                exp: expires,
                user: req.body.username
            });
        } else {
            res.send(401);
        }
    });

    app.post('/api/auth/session', function (req, res) {
        var studyId = req.body.studyId;
        var partId = req.body.partId;
        Study.findOne({studyId: studyId}).exec(function (err, studyResult) {
            if (err) {
                console.error(err);
                //todo better status
                res.end(418);
            } else {
                //check if session exists
                //TODO register session in db if one does not exist to prevent restarting
                Session.findOne({studyId: studyId, partId: partId}).exec(function(err, sessionResult){
                    if (err) {
                        console.error(err);
                        res.end(400);
                    } else if(sessionResult){
                        //participant has already been run on this study
                        console.log('auth | failure: participant already run for this study');
                        res.end('Participant already run for this study', 400);
                    } else if (studyResult.partIdMin > partId || partId > studyResult.partIdMax) {
                        //participant id outside of study's valid id range
                        console.log('auth | failure: partId out of range');
                        res.end(400);
                    } else {
                        //authenticate user
                        console.log('auth | authentication for ', studyId, ', ', partId, 'successful.');
                        var expires = moment().add('hours', 1).valueOf();
                        var token = jwt.encode({
                            iss: studyId + partId,
                            exp: expires
                        }, app.get('jwtTokenSecret'));
                        res.json({
                            token: token,
                            exp: expires,
                            user: studyId + partId,
                            stimulus: studyResult.stimulusTitle
                        });
                    }
                });
            }
        });
    });

}