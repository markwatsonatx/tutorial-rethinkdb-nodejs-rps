'use strict';

const Client = require('../models/client');
const GameController = require('./gameController');

class RPSController {

	constructor() {
		this.clients = [];
		this.gameController = new GameController();
	}

	onMessage(client, message, app) {
		if (message.command == 'join') {
			this.gameController.joinOrCreateGame(client, app)
				.then((result) => {
					console.log('User ' + client.player.id + ' joined game.');
				}).error((err) => {
				    console.log('Join game failed: ' + err);
			    });
		}
		else if (message.command == 'playMove') {
			this.gameController.playMove(client, message.move, app)
				.then((result) => {
					console.log('User ' + client.player.id + ' played move.');
				})
				.error((err) => {
					console.log('Error playing move.');
				});
		}
		else if (message.command == 'quit') {
			this.gameController.quitGame(client, app)
                .then((result) => {
                    console.log('User ' + client.player.id + ' quit game.');
                })
				.error((err) => {
					console.log('Error quiting game.');
				});
		}
	}

	onConnection(app, connection) {
		console.log((new Date()) + ' WebSocket connection accepted.');
		const client = new Client(connection);
		this.clients.push(client);
		connection.on('message', (message) => {
			if (message.type === 'utf8') {
				console.log('WebSocket server received message: ' + message.utf8Data);
				this.onMessage(client, JSON.parse(message.utf8Data), app);
			}
		});
		connection.on('close', (reasonCode, description) => {
			this.clients.splice(this.clients.indexOf(client), 1);
			console.log((new Date()) + 'WebSocket client ' + connection.remoteAddress + ' disconnected.');
		});
	}
}

// export the class
module.exports = RPSController;