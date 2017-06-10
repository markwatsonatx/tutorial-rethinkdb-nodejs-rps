'use strict'

const uuid = require('node-uuid');

class Player {

    constructor() {
		this.id = uuid.v4();
		this.moves = [];
    }
}

// export the class
module.exports = Player;