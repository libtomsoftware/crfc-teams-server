const mongodb = require('mongodb'),
    setup = require('./setup');

module.exports = new class DB {
    constructor() {
        setup.init(mongodb);
    }
};