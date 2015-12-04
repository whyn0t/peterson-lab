var uploadFile = require('../../services/googleDrive').insertFile;
var jwtauth = require('../../services/jwtauth');
var fs = require('fs');

module.exports.controller = function(app) {

    var auth = jwtauth.set(app);

    app.post('/api/avData', [auth], function (req, res) {
        uploadFile({
            path: ['eLab', 'avData', req.query.studyId, req.query.partId, req.file.originalname],
            body:  fs.createReadStream(req.file.path)
        }, function (err) {
            if (err){
                //TODO retry?
                console.error(err);
                res.sendStatus(500).send("Gdrive error. See logs.")
            } else {
                console.log('uploadFile | uploaded tp gDrive: ', req.file.originalname);
                res.sendStatus(200);
                fs.unlink(req.file.path, function (err) {
                    if (err){
                        console.error(err);
                        res.sendStatus(500).send("FS error. See logs.")
                    } else {
                        console.log('uploadFile | deleted temp file for: ', req.file.originalname);
                    }
                });
            }
        });
    });
}