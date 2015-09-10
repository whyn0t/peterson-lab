//why have some sources in vendor and some in node_modules?
//what do bower and toastr do?

const CLIENT_ID = " 962654615166-c4ordtuul3hh80ti4j5mrrnf2jealu5s.apps.googleusercontent.com ";
const CLIENT_SECRET = "Yrdab0zQRCuNfyddd2d3SQHD";
const REFRESH_TOKEN = "1/Yra7quKZxh0XlpDCSzIdL1ipINuE6zGtkPqG6ye-Hs1IgOrJDtdun6zK6XiATCKT";
const ENDPOINT_OF_GDRIVE = 'https://www.googleapis.com/drive/v2';
const FOLDER_ID = '0B7xxmI9nb2CLb0Z5MXNHUXQ2MUU';

var express = require('express'),
    fs = require('fs'),
	stylus = require('stylus'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    multer = require('multer'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    json2csv = require('json2csv'),
    archiver = require('archiver'),
    GoogleTokenProvider = require("refresh-token").GoogleTokenProvider,
    async = require('async'),
    request = require('request'),
    uploadFile = require('./server/services/googleDrive').insertFile,
    shareData = require('./server/services/googleDrive').share,
    unshareData = require('./server/services/googleDrive').unshare,
    _accessToken;

var done=false;

//set your environment variable? what does this effect?
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'developmen';
console.log(env);

//create new express app
var app = module.exports = express();
var jwtauth = require('./jwtauth.js');

//stylus configuration... what does stylus do?
function compile(str, path){
	return stylus(str).set('filename', path);
}

//express configuration
app.set('views', __dirname + '/server/views');
app.set('view engine', 'jade');
//what is "use" for?
app.use(logger('dev'));
app.use(bodyParser());
app.use(bodyParser.urlencoded({ extended: true}));
//what are we setting here?
app.use(stylus.middleware(
	{
		src: __dirname + "/public",
		compile: compile
	}
));

app.use(multer({ dest: './tmp/' }).single('file'));

app.post('/api/avData', [jwtauth], function(req, res) {
    console.log(req.file);

    //only store non-demo data
    if (req.query.studyId != 'demo') {
        var file = __dirname + '/avData/' + req.query.studyId + '/' + req.query.partId + '/' + req.file.originalname;
        fs.mkdir(__dirname + '/avData/' + req.query.studyId, function () {
            fs.mkdir(__dirname + '/avData/' + req.query.studyId + '/' + req.query.partId, function () {
                fs.readFile(req.file.path, function (err, data) {
                    fs.writeFile(file, data, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            response = {
                                message: 'File uploaded successfully',
                                filename: req.file.name
                            };
                            //upload to google drive
                            //TODO delete local file on success
                            uploadFile({
                                path: ['avData', req.query.studyId, req.query.partId, req.file.originalname],
                                location: file
                            });
                        }
                        console.log(response);
                        res.status(200).end(JSON.stringify(( response )));
                        //fs.unlink(req.file.path, function (err) {
                        //    console.log(err);
                        //});
                    });
                });
            });
        });
    }
});

//static route handling
app.use(express.static(__dirname + "/public"));

//mongo setup
if (env === 'development') {
    mongoose.connect('mongodb://localhost/petersonLab');
} else {
    mongoose.connect('mongodb://nigelsmk:simplepassword@ds049878.mongolab.com:49878/heroku_9z2qdrt5/petersonlab');
}
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'));
db.once('open', function callback(){
    console.log('petersonLab db opened');
});

var sessionSchema = mongoose.Schema({
    studyId: String,
    partId: Number,
    stopTime: Number,
    response: String,
    dateTime: {type: Date, default: Date.now()}
});

var Session = mongoose.model('Session', sessionSchema);

var studySchema = mongoose.Schema({
    studyId: String,
    partIdMin: Number,
    partIdMax: Number,
    active: Boolean,
    dateTime: {type: Date, default: Date.now()}
});

var Study = mongoose.model('Study', studySchema);

var shareSchema = mongoose.Schema({
    name: String,
    email: String,
    permission: String
});

var Share = mongoose.model('Share', shareSchema);

app.post('/api/sessionData', [jwtauth], function(req, res){
    console.log('got session data post');
    console.log(req.body);
    var session = new Session({
            studyId: req.body.studyId,
            partId: req.body.partId,
            stopTime: req.body.stopTime,
            response: req.body.response
        });
    if (session.studyId != 'demo') {
        session.save(function (err) {
            if(err){
                console.log(err);
                //TODO need better failure status
                res.sendStatus(418);
            } else {
                res.sendStatus(200);
            }
        });
    }
});

//security
app.set('jwtTokenSecret', 'PETERSON_LAB');
app.post('/api/auth', function(req, res){
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

app.post('/api/auth/session', function(req, res){
    var studyId = req.body.studyId;
    var partId = req.body.partId;
   Study.findOne({studyId: studyId}).exec(function(err, result){
      if (err){
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
                  user: studyId + partId
              });
          } else {
              res.sendStatus(401);
          }
      }
   });
});


//routes
//render parses from jade?
app.get('/partials/:partialPath', function(req, res){
    res.render('partials/' + req.params.partialPath);
});

app.get('/api/getCsv', [jwtauth], function(req, res){
    Session.find({}, {"_id": 0, "__v": 0}).exec(function(err, result){
        if (err){
            console.log(err);
            res.end(401);
        } else {
            json2csv({data: result}, function(err, csv){
                if(err){
                    console.log(err);
                    res.end('csv conversion error', 400);
                }
                res.send(csv);
            });
        }
    });

});

app.get('/api/download/:studyId', function(req, res){
    var archive = archiver.create('zip');

    res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment; filename=' + req.params.studyId + '-avData.zip'
    });

    archive.on('error', function(err){
        console.log(err);
    });

    archive.pipe(res);
    archive.bulk([
        { expand: true, cwd: 'avData/' + req.params.studyId, src: ['**/*'], dest: 'avData/' + req.params.studyId}
    ]);
    archive.finalize();
})

app.get('/api/getStudies', [jwtauth], function(req, res){
   Study.find({}, {"__v": 0}).exec(function(err, result){
       if (err){
           console.log(err);
           //TODO need better status
           res.end(418);
       } else {
           //console.log(result);
           res.json(result);
       }
   });
});

app.post('/api/removeStudy', [jwtauth], function(req, res){
    console.log(req.body._id);
    Study.findByIdAndRemove(req.body._id, function(err, result){
        if (err) {
            console.log(err);
            //todo need better code
            res.sendStatus(418);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/api/newStudy', [jwtauth], function(req, res){
    var study = new Study(req.body);
    console.log(req.body);
    study.save(function (err) {
        if (err) {
            console.log(err);
            //TODO need better failure status
            res.sendStatus(400);
        } else {
            res.sendStatus(200);
        }
    });
});

app.post('/api/share', [jwtauth], function(req, res){
    var share = new Share(req.body);
    console.log(req.body);
    share.save(function(err) {
        if (err) {
            console.log(err);
            res.sendStatus(418);
        } else {
            //give permissions to email
            shareData('avData', req.body.email, req.body.permission);
            res.sendStatus(200);
        }
    })
})

app.get('/api/getShared', [jwtauth], function(req, res){
    Share.find({}, {"__v": 0}).exec(function(err, result){
        if (err){
            console.log(err);
            //TODO need better status
            res.end(418);
        } else {
            console.log("Got share: ", result);
            res.json(result);
        }
    });
});

app.post('/api/unshare', [jwtauth], function(req, res){
    Share.findByIdAndRemove(req.body._id, function(err){
        if (err) {
            console.log(err);
            //todo need better code
            res.sendStatus(418);
        } else {
            unshareData('avData', req.body.email, function(){
                console.log('Unshared:', req.body.email);
            });
            res.sendStatus(200);
        }
    });
});

app.get('api/admin', [jwtauth], function(req, res){

});

app.get('/admin', function(req, res){
    res.render('admin', {

    });
});

app.get('*', function(req, res){
	res.render('index', {

    });
});

/*
//GDrive

async.waterfall([
    //obtain a new access token
    function(callback) {
        console.log("Obtaining access token");
        var tokenProvider = new GoogleTokenProvider({
            'refresh_token': REFRESH_TOKEN,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        });
        tokenProvider.getToken(callback);
    },
    //retrieve the children in a specified folder
    function(accessToken, callback) {
        console.log("Retreiving children");
        _accessToken = accessToken;
        request.get({
            'url': ENDPOINT_OF_GDRIVE + '/files/' + FOLDER_ID + '/children',
            'qs': {
                'access_token': accessToken
            }
        }, callback);
    },
    //parse the response
    function(response, body, callback) {
        var list = JSON.parse(body);
        if (list.error) {
            return callback(list.error);
        }
        callback(null, list.items);
    },
    //get the file information of the children
    function(children, callback) {
        async.map(children, function(child, cback) {
            request.get({
                'url': ENDPOINT_OF_GDRIVE + '/files/' + child.id,
                'qs': {
                    'access_token': _accessToken
                }
            }, function(err, response, body) {
                body = JSON.parse(body);
                cback(null, {
                    'title': body.title,
                    'md5Checksum': body.md5Checksum
                });
            })
        }, callback);
    }
], function(err, results) {
    if (!err) {
        console.log(results);
    } else {
        console.log(err);
    }
});
*/
const port = process.env.PORT || 3030;
app.listen(port);
console.log("Listening on port " + port + "...");
