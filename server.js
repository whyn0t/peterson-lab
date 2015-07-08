//why have some sources in vendor and some in node_modules?
//what do bower and toastr do?


var express = require('express'),
	stylus = require('stylus'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
    mongoose = require('mongoose');

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
//what are we setting here?
app.use(stylus.middleware(
	{
		src: __dirname + "/public",
		compile: compile
	}
));

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
var messageSchema = mongoose.Schema({message: String});
var Message = mongoose.model('Message', messageSchema);
var mongoMessage;
Message.findOne().exec(function(err, messageDoc){
    mongoMessage = messageDoc.message;
});


//routes
//render parses from jade?
app.get('/partials/:partialPath', function(req, res){
    res.render('partials/' + req.params.partialPath);
})

app.get('*', function(req, res){
	res.render('index', {
        mongoMessage: mongoMessage
    });
});

const port = process.env.PORT || 3030;
app.listen(port);
console.log("Listening on port " + port + "...");
