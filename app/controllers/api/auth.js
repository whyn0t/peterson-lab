;//TODO better way to do path?
var mongoose = require('mongoose'),
    Study = mongoose.model('Study'),
    Session = mongoose.model('Session'),
    //Study = require('../../models/study'),
    //Session = require('../../models/session'),
    AppData = require('../../models/appData'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    flakeIdGen = require('flake-idgen'),
    intformat = require('biguint-format'),
    generator = new flakeIdGen;

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

    //provides a key (participantId) to the qualtrics survey for later authentication
    app.get('/api/auth/generateKey', function(req, res) {
        var studyKey = req.query.studyKey;
        var sid = req.query.sid;
        Study.findOne({sid: sid, key: studyKey}).exec(function (err, result) {
            if (err) {
                console.error(err);
                res.end(418);
                return;
            } else if (result == null) { //the study does not exist
                res.end(418);
                return;
            }
            var pid = intformat(generator.next(), 'dec');
            var session = new Session({
                sid: sid,
                pid: pid,
                started: false
            });
            session.save(function (err) {
                if (err) {
                    console.error(err);
                    res.send(500);
                    return;
                }
                res.send('pid=' + pid);
            });
        });
    });

    //authenticates the participantId/sid and generates a JWTtoken
    app.post('/api/auth/session', function (req, res) {
        var sid = req.body.sid;
        var pid = req.body.pid;
        Study.findOne({sid: sid}).exec(function (err, studyResult) {
            if (err) {
                console.error(err);
                //todo better status
                res.end(418);
                return;
            } else if ( pid == 'demo' ) {
                res.json({
                    token: 'demo',
                    pid: pid,
                    sid: sid,
                    youTubeId: studyResult.youTubeId,
                    instructions: studyResult.instructions,
                    redirect: studyResult.redirect
                });
                return;
            }
            //check if session exists and it has not been started
            Session.findOne({sid: sid, pid: pid, started: false}).exec(function(err, sessionResult){
                if (err) {
                    console.error(err);
                    res.end(400);
                } else if(sessionResult) { //there is a session registered with the given pid/sid
                    //authenticate user
                    console.log('auth | authentication for ', sid, ', ', pid, 'successful.');
                    var expires = moment().add('hours', 1).valueOf();
                    var token = jwt.encode({
                        iss: sid + pid,
                        exp: expires
                    }, app.get('jwtTokenSecret'));
                    res.json({
                        token: token,
                        exp: expires,
                        pid: pid,
                        sid: sid,
                        youTubeId: studyResult.youTubeId,
                        instructions: studyResult.instructions
                    });
                    //mark the session as started
                    Session.findOneAndUpdate({ sid: sid, pid: pid }, { started: true }, null, function (result) {
                        if (err) {
                            //TODO what to do on error?
                            console.error();
                        }
                    });
                } else { //no session matches the requests parameters
                    res.sendStatus(400);
                }
            });
        });
    });

}