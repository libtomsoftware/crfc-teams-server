const logger = require('./logger'),
    mongodb = require('mongodb'),
    db = require('./db'),
    CONFIG = require('./config'),
    FILE_ID = 'core';

module.exports = new class Core {
    constructor() {
        this.startServer();
        this.setupDb();
    }

    startServer() {
        logger.log(FILE_ID, `Booting ${CONFIG.APP.NAME}...`);
        require('./http-server').boot();
    }

    setupDb() {
        db.init(mongodb);
    }
};
