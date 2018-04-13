const logger = require('./logger'),
    mongodb = require('mongodb'),
    setup = require('./setup'),
    CONFIG = require('./config'),
    FILE_ID = 'core';

module.exports = new class Core {
    constructor() {
        this.startServer();
        this.setupMongoDb();
    }

    startServer() {
        logger.log(FILE_ID, `Booting ${CONFIG.APP.NAME}...`);
        require('./http-server').boot();
    }

    setupMongoDb() {
        setup.init(mongodb);
    }
};
