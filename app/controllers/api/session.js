var Session = require('../../models/session');
var jwtauth = require('../../services/jwtauth');

module.exports.controller = function(app) {

    var auth = jwtauth.set(app);

    app.post('/api/sessionData', [auth], function (req, res) {
        console.log('got session data post');
        console.log(req.body);
        var session = new Session({
            sid: req.body.sid,
            pid: req.body.pid
        });
        session.save(function (err) {
            if (err) {
                console.log(err);
                //TODO need better failure status
                res.sendStatus(418);
            } else {
                res.sendStatus(200);
            }
        });
    });
}