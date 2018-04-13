const http = require('./http'),
    logger = require('./logger'),
    CONFIG = require('./config'),
    FILE_ID = 'core';

module.exports = new class Core {
    constructor() {
        this.startServer();
    }

    startServer() {
        logger.log(FILE_ID, `Booting ${CONFIG.APP.NAME}...`);
        require('./http-server').boot();
    }

    get api() {
        return require('./api');
    }

    get config() {
        return require('./config');
    }

    get http() {
        return http;
    }

    get logger() {
        return logger;
    }
};
