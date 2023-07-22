// create web server
var express = require('express');
var app = express();
// create server
var server = require('http').createServer(app);
// create socket
var io = require('socket.io')(server);
// database
var mongoose = require('mongoose');
// database connection
mongoose.connect('mongodb://localhost:27017/chat', function(err){
	if(err){
		console.log(err);
	} else {
		console.log('Connected to mongodb!');
	}
});
// create schema
var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
	created: {type: Date, default: Date.now}
});
// create model
var Chat = mongoose.model('Message', chatSchema);

// serve static files
app.use(express.static(__dirname + '/public'));

// route
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

// socket
io.on('connection', function(socket){
	// load chat
	var query = Chat.find({});
	query.sort('-created').limit(8).exec(function(err, docs){
		if(err) throw err;
		socket.emit('load old msgs', docs);
	});
	// send message
	socket.on('send message', function(data){
		var newMsg = new Chat({msg: data, nick: socket.nickname});
		newMsg.save(function(err){
			if(err) throw err;
			io.sockets.emit('new message', {msg: data, nick: socket.nickname});
		});
	});
	// new user
	socket.on('new user', function(data, callback){
		if(data in users){
			callback(false);
		} else {
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});
	// update nicknames
	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}
	// disconnect
	socket.on('disconnect', function(data){
		if(!socket.nickname) return;
		delete users[socket.nickname];
		updateNicknames();
	});
});

// listen on port 3000
server.listen(3000, function(){
	console.log('Server running on port 3000');
});