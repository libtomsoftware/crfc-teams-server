const db = require('../core/db');

module.exports = new class Players {
    find(callback) {
        db.find('players', null, callback);  
    }

    insert(body, callback) {
        db.insert('players', body, callback);  
    }

    delete(id, callback) {
        db.remove('players', id, callback); 
    }
}