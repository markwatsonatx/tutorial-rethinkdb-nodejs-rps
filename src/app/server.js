const config = require("./config");
const cfenv = require('cfenv');
const express = require('express');
const r = require('rethinkdb');
const DatabaseController = require('./controllers/databaseController');
const RPSController = require('./controllers/rpsController');
const WebSocketServer = require('websocket').server;

const appEnv = cfenv.getAppEnv();
const app = express();
const http = require('http').Server(app);

let games = [];
let players = [];

const databaseController = new DatabaseController();
const rpsController = new RPSController();

(function(app) {
	r.connect(config.rethinkdb, (err, conn) => {
		if (err) {
			console.log(new Date() + ' Could not open a connection to RethinkDB.');
			console.log(new Date() + ' ' + err.message);
		}
		else {
			console.log(new Date() + ' Connected to RethinkDB.');
			app.set('rethinkdb-conn', conn);
			databaseController.createDatabase(conn, config.rethinkdb.db)
				.then(function() {
					return databaseController.createTable(conn, 'games');
				})
				.catch(function(err) {
					console.log(new Date() + ' Error creating database and/or table: ' + err);
				});
		}
	});

	// attach web socket server
	const webSocketServer = new WebSocketServer({httpServer: http, autoAcceptConnections: true});
	webSocketServer.on('connect', (connection) => {
		rpsController.onConnection(app, connection);
	});

})(app);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
const port = appEnv.isLocal ? 3000 : appEnv.port;
const hostname = appEnv.isLocal ? '0.0.0.0' : appEnv.bind;;

http.listen(port, hostname, () => {
	console.log(`Server started on ${hostname}:${port}.`)
});
