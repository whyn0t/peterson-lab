//why have some sources in vendor and some in node_modules?
//what do bower and toastr do?


var express = require('express'),
    fs = require('fs'),
	stylus = require('stylus'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    multer = require('multer'),
    jwt = require('jwt-simple'),
    jwtauth = require('./jwtauth.js'),
    moment = require('moment'),
    json2csv = require('json2csv');

var done=false;

//set your environment variable? what does this effect?
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log(env);

//create new express app
var app = express();

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

app.post('/api/avData', function(req, res) {
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
                        }
                        console.log(response);
                        res.status(200).end(JSON.stringify(( response )));
                        fs.unlink(req.file.path, function (err) {
                            console.log(err);
                        });
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
    mongoose.connect('mongodb://nigelsmk:tim54p4ML@ds049198.mongolab.com:49198/petersonlab');
}
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'));
db.once('open', function callback(){
    console.log('petersonLab db opened');
});

var sessionSchema = mongoose.Schema({
    studyId: String,
    partId: String,
    stopTime: String,
    response: String,
    dateTime: {type: Date, default: Date.now()}
});

var Session = mongoose.model('Session', sessionSchema);

app.post('/api/sessionData', function(req, res){
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
            console.log(err);
        });
    }
});

//security
app.set('jwtTokenSecret', 'PETERSON_LAB');
app.post('/api/auth', function(req, res){
    console.log(req.body);
    if (req.body.username == 'admin' && req.body.password == 'petersonlab1!') {
        var expires = moment().add('days', 7).valueOf();
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


//routes
//render parses from jade?
app.get('/partials/:partialPath', function(req, res){
    res.render('partials/' + req.params.partialPath);
});

app.get('/api/admin', [jwtauth], function(req, res){
    Session.find({}).exec(function(err, result){
        if (err){
            console.log(err);
            res.end(401);
        }
        json2csv({data: result}, function(err, csv){
            if(err){
                console.log(err);
                res.end('csv conversion error', 400);
            }
            res.send(csv);
        });
    });

});

app.get('*', function(req, res){
	res.render('index', {

    });
});



const port = process.env.PORT || 3030;
app.listen(port);
console.log("Listening on port " + port + "...");
