var jwt = require('jwt-simple'),
    url = require('url'),
    app = require('./server');

module.exports = function(req, res, next) {
    var token = (req.body && req.body.access_token)
                || (req.query && req.query.access_token)
                || req.headers['x-access-token'];

    console.log(req.body);
    if (token) {
        try {
            var decoded = jwt.decode(token, app.get('jwtTokenSecret'));
            // handle token here
            if (decoded.exp <= Date.now()) {
                res.end('Access token has expired', 400);
            }
            next();
        } catch (err) {
            console.log(err);
            res.end('Invalid token', 401);
        }
    } else {
        console.log("no token");
        res.end('Invalid token', 401);
    }
};