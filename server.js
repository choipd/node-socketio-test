var express = require('express')
	, io = require('socket.io');


var app = express.createServer()
	, socket = io.listen(app)
	, servers = {}
	, server_idx = {};

socket.configure(function(){
	socket.set('log level', 4);
});

// Configuration
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('view options', { layout: false });
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
	
	con.on('getServerByRR', function(key, fn){
		console.log('con getServerByRR -> ');
		console.dir(key);

		fn(getServerByRR(key));
		
	});
	
	con.on('getServerListByRR', function(fn){
		console.log('con getServerListByRR -> ');
		var i = 0;
		var result = [];
		for(key in servers){
			result.push(getServerByRR(key));
		}
		console.log('result -> ');
		console.dir(result);
				
		fn(result);
	});
	
	con.on('join', function(msg){
		console.log('new join ->');
		console.dir(msg);
		for(key in msg){
			if(servers[key]){
				servers[key].push(msg[key]);
			}else{
				servers[key] = [];
				servers[key].push(msg[key]);
			}
			console.log('length : ' + servers[key].length);
			//server_idx[key] = servers[key].length;
			con.serverName = msg[key].serverName;
		}
		console.log('servers - >');
		console.dir(servers);
//		console.log('server_idx - >');
//		console.dir(server_idx);
		console.log('connect - > ' + con.serverName);
	});
	
	con.on('disconnect', function(){
		if(!con.serverName) return;
		
		for(key in servers){
			for(var i=0; i < servers[key].length; i++){
				console.log('-> ' + servers[key][i].serverName);
				
				if(servers[key][i].serverName == con.serverName){
					console.log('del -> ' + servers[key][i]);
					servers[key].splice(i, 1);
//					server_idx[key] = servers[key].length;
				}
			}
		}
		
		console.log('servers - >');
		console.dir(servers);
//		console.log('server_idx - >');
//		console.dir(server_idx);
		console.log("disconnect : " + con.serverName);
		
		con.broadcast.emit('announcement', {server: con.serverName, action: "disconnected"});
	})
});

function getServerByRR(key){
	var i = 0;
	var name = {};

	if(server_idx[key]){
		console.log('-> ' + server_idx[key]);
		i = server_idx[key];
		if(i >= servers[key].length){
			i = 0;
		}
	} else {
		console.log('-> ' + server_idx[key]);
		server_idx[key] = 0;
		i=0;
	}

	if(servers[key]) {
        console.dir(servers[key][i]);
        server_idx[key] = i + 1;
        console.log('idx -> ');
        console.dir(server_idx);

        name = servers[key][i];
        name['service'] = key;
	}

    console.log('return -> ');
    console.dir(name);

	return name;
}
    
app.listen(8000);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);