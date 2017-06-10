'use strict'

const Player = require('./player');
const r = require('rethinkdb');

class Client {

	constructor(connection) {
		this.connection = connection;
		this.player = new Player();
	}

	onJoinedGame(gameId, player1, app) {
		this.gameId = gameId;
		this.player1 = player1;
		const rdbConn = app.get('rethinkdb-conn');
		r.table('games').get(this.gameId).changes({includeInitial: true}).run(rdbConn, (err, cursor) => {
			if (err) {
				throw err;
			}
			cursor.each((err, row) => {
				if (err) {
					throw err;
				}
				else {
					const gameJson = JSON.stringify(row.new_val, null, 2);
					console.log(gameJson);
					this.connection.sendUTF(gameJson);
				}
			});
		});
	}
}

// export the class
module.exports = Client;