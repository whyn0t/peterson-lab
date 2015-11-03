//TODO better way to do path?
var Study = require('../../models/study'),
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
        Study.findOne({studyId: studyId}).exec(function (err, result) {
            if (err) {
                console.log(err);
                //todo better status
                res.end(418);
            } else {
                if (result.partIdMin <= partId && partId <= result.partIdMax) {
                    console.log(result.partIdMin, partId, result.partIdMax);
                    var expires = moment().add('hours', 1).valueOf();
                    var token = jwt.encode({
                        iss: studyId + partId,
                        exp: expires
                    }, app.get('jwtTokenSecret'));
                    res.json({
                        token: token,
                        exp: expires,
                        user: studyId + partId,
                        stimulusUrl: "https://s3-us-west-2.amazonaws.com/peterson-elab/+" + result.stimulusUrl
                    });
                } else {
                    res.sendStatus(401);
                }
            }
        });
    });

}