var jwtauth = require('../../services/jwtauth'),
Session = require('../../models/session'),
json2csv = require('json2csv'),
uploadFile = require('../../services/googleDrive').insertFile,
moment = require('moment');

module.exports.controller = function(app){
    var auth = jwtauth.set(app);
    app.get('/api/getCsv', function(req, res){
        Session.find({}, {"_id": 0, "__v": 0}).lean().exec(function(err, result){
            if (err){
                console.error(err);
                res.status(500).send("Mongoose error. See logs.");
            } else if (result.length > 0){
                json2csv({data: result}, function(err, csv){
                    if(err){
                        console.error(err);
                        res.status(500).send('Csv conversion error. See logs.');
                    } else {
                        uploadFile({
                            path: ['eLab', 'sessionData', moment().format('MM-DD-YYYY') + '.csv'],
                            body: csv
                        }, function(err) {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Csv conversion error. See logs.');
                            } else {
                                res.sendStatus(200);
                            }
                        })
                    }
                });
            }
        });

    });
}