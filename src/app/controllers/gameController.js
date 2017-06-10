'use strict';

const r = require('rethinkdb');

const STATUS_AWAITING_PLAYER_2 = 'Awaiting player 2';

class GameController {

	constructor() {
	}

	joinOrCreateGame(client, app) {
		console.log('Joining game...');
		const rdbConn = app.get('rethinkdb-conn');
		// first we try and update a game that is awating a second player
		// if the update is successful then we are ready to start the game
		// if the update fails then we need to create a new game
		return r.table('games').filter({'status': 'Awaiting player 2'}).limit(1).update((game) => {
			return r.branch(
				game('status').eq('Awaiting player 2'),
				{status: 'Ready', player2: client.player},
				{}
			)
		}, {returnChanges: true}).run(rdbConn)
			.then((result) => {
				if (result.replaced == 0) {
					const game = {
						status: STATUS_AWAITING_PLAYER_2,
						player1: client.player
					};
					return r.table('games').insert(game).run(rdbConn);
				}
				else {
					return result.changes[0].new_val.id;
				}
			})
			.then((result) => {
				if (result.inserted && result.generated_keys) {
					client.onJoinedGame(result.generated_keys[0], true, app);
				}
				else {
					client.onJoinedGame(result, false, app);
				}
			})
			.error((err) => {
			});
	}

	playMove(client, move, app) {
		const rdbConn = app.get('rethinkdb-conn');
		if (client.player1) {
			return r.table('games').get(client.gameId).update({
				player1: {moves: r.row('player1')('moves').append(move)}
			}).run(rdbConn);
		}
		else {
			return r.table('games').get(client.gameId).update({
				player2: {moves: r.row('player2')('moves').append(move)}
			}).run(rdbConn);
		}
	}

	quitGame(client, app) {
		return Promise.resolve();
	}
}

// export the class
module.exports = GameController;