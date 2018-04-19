const db = require('../core/db');

module.exports = new class Players {
    find(callback) {
        db.find('players', null, callback);  
    }
}