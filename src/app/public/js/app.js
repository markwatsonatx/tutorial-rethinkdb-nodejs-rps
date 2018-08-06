var ROCK = 0;
var PAPER = 1;
var SCISSORS = 2;

var LOSE = -1;
var TIE = 0;
var WIN = 1;

var STATUS_AWAITING_PLAYER_2 = 'Awaiting opponent';
var STATUS_READY = 'Ready';

var app = {

    webSocket: null,
    webSocketConnected: false,
    mainStatus: 'Joining game...',
    roundStatus: '',
    myScoreText: '',
    otherPlayerScoreText: '',
    round: 0,
    player1: false,
    player1Score: 0,
    player2Score: 0,
    myMovesPlayed: 0,
    canPlayMove: false,

    sendMessage: function(msg) {
        app.webSocket.send(JSON.stringify(msg));
    },

    sendJoinGameCommand : function() {
        app.sendMessage({command: 'join'});
    },

    sendPlayMoveCommand : function(move) {
        app.sendMessage({
            command: 'playMove',
            move: move
        });
    },

    initGame: function() {
		app.mainStatus = 'Joining game...';
		app.roundStatus = '';
		app.myScoreText = '';
		app.otherPlayerScoreText = '';
		app.round = 0;
		app.player1 = false;
		app.player1Score = 0;
		app.player2Score = 0;
		app.myMovesPlayed = 0;
		app.canPlayMove = false;
    },

    quitGame: function() {
        var win = (app.player1 && app.player1Score >= 3) || (! app.player1 && app.player2Score >= 3);
        if (win) {
            app.roundStatus = 'You win!';
        }
        else {
            app.roundStatus = 'You lose :(';
        }
    },

    playMove: function(move) {
        if (app.canPlayMove) {
            app.canPlayMove = false;
            app.roundStatus = 'You played ' + app.getMoveStr(move);
            app.sendPlayMoveCommand(move);
        }
    },

    getMoveStr: function(move) {
        if (move == ROCK) {
            return "Rock"
        }
        else if (move == PAPER) {
            return "Paper"
        }
        else {
            return "Scissors"
        }
    },

    processMessage: function(msg) {
        var game = JSON.parse(msg);
        if (game) {
            if (game.status == STATUS_AWAITING_PLAYER_2) {
                app.player1 = true;
                app.mainStatus = STATUS_AWAITING_PLAYER_2;
            }
            else if (game.status == STATUS_READY) {
                if (game.player2.moves.length == game.player1.moves.length && game.player1.moves.length > app.round) {
                    app.processRound(game);
                }
                app.mainStatus = 'Round ' + (app.round + 1);
                if (app.player1Score >= 3 || app.player2Score >= 3) {
                    app.quitGame();
                }
                else {
                    if (app.myMovesPlayed <= app.round) {
                        app.myMovesPlayed += 1;
                        app.canPlayMove = true;
                    }
                }
            }
            app.refreshUI();
        }
    },

    processRound: function(game) {
        var roundResultPlayer1 = TIE;
        var roundResultPlayer2 = TIE;
        var player1Move = game.player1.moves[game.player1.moves.length - 1];
        var player2Move = game.player2.moves[game.player2.moves.length - 1];
        if (player1Move != player2Move) {
            if (player1Move == ROCK) {
                if (player2Move == PAPER) {
                    roundResultPlayer1 = LOSE;
                    roundResultPlayer2 = WIN;
                }
                else {
                    roundResultPlayer1 = WIN;
                    roundResultPlayer2 = LOSE;
                }
            }
            else if (player1Move == PAPER) {
                if (player2Move == SCISSORS) {
                    roundResultPlayer1 = LOSE;
                    roundResultPlayer2 = WIN;
                }
                else {
                    roundResultPlayer1 = WIN;
                    roundResultPlayer2 = LOSE;
                }
            }
            else if (player1Move == SCISSORS) {
                if (player2Move == ROCK) {
                    roundResultPlayer1 = LOSE;
                    roundResultPlayer2 = WIN;
                }
                else {
                    roundResultPlayer1 = WIN;
                    roundResultPlayer2 = LOSE;
                }
            }
        }
        if (roundResultPlayer1 == WIN) {
            app.player1Score += 1;
            if (app.player1) {
                app.roundStatus = 'You Win Round ' + (app.round + 1);
            }
            else {
                app.roundStatus = 'You Lose Round ' + (app.round + 1);
            }
        }
        else if (roundResultPlayer2 == WIN) {
            app.player2Score += 1;
            if (app.player1) {
                app.roundStatus = 'You lose Round ' + (app.round + 1);
            }
            else {
                app.roundStatus = 'You win Round ' + (app.round + 1);
            }
        }
        else {
            app.roundStatus = 'Round ' + (app.round + 1) + ' is a tie';
        }
        app.round += 1;
        var myScore = app.player1 ? app.player1Score : app.player2Score;
        var otherScore = app.player1 ? app.player2Score : app.player1Score;
        app.myScoreText = '' + myScore;
        app.otherPlayerScoreText = '' + otherScore;
    },

    refreshUI: function() {
        document.getElementById('rock-btn').disabled = ! app.canPlayMove;
        document.getElementById('paper-btn').disabled = ! app.canPlayMove;
        document.getElementById('scissors-btn').disabled = ! app.canPlayMove;
        document.getElementById('main-status-span').innerText = app.mainStatus;
        document.getElementById('round-status-span').innerText = app.roundStatus;
        document.getElementById('my-score-span').innerText = app.myScoreText;
        document.getElementById('other-player-score-span').innerText = app.otherPlayerScoreText;
    },

    connectToWebSocketServer: function() {
        if ("WebSocket" in window) {
            app.webSocket = new WebSocket('wss://' + window.location.href.split('/')[2]);
            app.webSocket.onopen = function () {
                console.log("Websocket connected.")
                app.webSocketConnected = true;
				app.sendJoinGameCommand();
            };
            app.webSocket.onmessage = function (evt) {
				app.webSocketConnected = true;
                app.processMessage(evt.data);
            };
            app.webSocket.onclose = function () {
                console.log("Websocket closed.");
				app.initGame();
				app.refreshUI();
				app.webSocketConnected = false;
            };
        }
        else {
            alert("WebSocket not supported browser.");
        }
    },

    init: function() {
        document.getElementById('rock-btn').addEventListener('click', function () {
            app.playMove(ROCK);
        });
        document.getElementById('paper-btn').addEventListener('click', function () {
            app.playMove(PAPER);
        });
        document.getElementById('scissors-btn').addEventListener('click', function () {
            app.playMove(SCISSORS);
        });
        app.refreshUI();
        app.onTimer();
    },

    onTimer: function() {
        if (! app.webSocketConnected) {
            app.connectToWebSocketServer();
        }
		else {
			app.webSocket.send(JSON.stringify({command: 'ping'}));
		}
        setTimeout(app.onTimer, 5000);
    }
};

(function() {
    app.init();
})();
