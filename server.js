//why have some sources in vendor and some in node_modules?
//what do bower and toastr do?


var express = require('express'),
    fs = require('fs'),
	stylus = require('stylus'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    multer = require('multer'),
    mkdirp = require('mkdirp');

var done=false;

//set your environment variable? what does this effect?
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

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

    var file = __dirname + '/' + 'avData' + '/' + req.query.id + '/' + req.file.originalname;
    //mkdirp(__dirname + '/' + 'avData' + '/' + req.query.id, function(err){
//        console.log(err);
//    });
    fs.mkdir(__dirname + '/' + 'avData' + '/' + req.query.id, function() {
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


//routes
//render parses from jade?
app.get('/partials/:partialPath', function(req, res){
    res.render('partials/' + req.params.partialPath);
});

app.get('*', function(req, res){
	res.render('index', {

    });
});

const port = process.env.PORT || 3030;
app.listen(port);
console.log("Listening on port " + port + "...");
