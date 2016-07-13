var gdrive = require('../../services/googleDrive');
var jwtauth = require('../../services/jwtauth');
var fs = require('fs');

module.exports.controller = function(app) {

    var auth = jwtauth.set(app);

    app.post('/api/avData', [auth], function (req, res) {
        //TODO if we get to this point is the file fully uploaded? Seems to be so
        res.sendStatus(200);
         gdrive.queueRequest(function(callback){
            gdrive.insert({
                path: ['eLab', 'avData', req.query.sid, req.query.pid],
                title: req.file.originalname,
                body:  fs.createReadStream(req.file.path)
            }, function (err) {
                if (err){
                    //TODO retry?
                    console.error(err);
                } else {
                    console.log('uploadFile | uploaded to gDrive: ', req.file.originalname);
                    callback();
                    fs.unlink(req.file.path, function (err) {
                        if (err){
                            console.error(err);
                        } else {
                            console.log('uploadFile | deleted temp file for: ', req.file.originalname);
                        }
                    });
                }
            });
        });
    });
}