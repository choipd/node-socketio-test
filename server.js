var express = require('express')
	, io = require('socket.io');


var app = express.createServer()
	, socket = io.listen(app)
	, serverNames = {};

socket.configure(function(){
	socket.set('log level', 4);
});

// Configuration
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.favicon());
	app.use(express.logger({ buffer: 5000}));
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/', function (req, res) {
    res.render('client');
});


socket.on('connection', function(con){
	console.log("connection : " + con.id);
	
	con.on('message', function(msg){
		console.log('con message ->');
		console.dir(msg);		
	});
	
	con.on('serverName', function(msg){
		var serverName = msg.serverName;
		
		if(serverNames[serverName]){
			console.log('serverName-> ' + serverName + ' : ture');
		} else{
			console.log('serverName-> ' + serverName + ' : false');
			serverNames[serverName] = con.serverName = serverName;
			con.broadcast.emit('announcement', {server: serverName, action: 'connected'});
			con.broadcast.emit('serverNames', serverNames);
		}
		
	})
	
	con.on('disconnect', function(){
		if(!con.serverName) return;
		
		delete serverNames[con.serverName];
		con.broadcast.emit('announcement', {server: socket.serverName, action: 'disconnected'})
		con.broadcast.emit('serverNames', serverNames);
		console.log("disconnect : " + con.id);
	})
});
    
app.listen(8000);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);