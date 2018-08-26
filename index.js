const fs = require('fs-extra'),
    configExists = fs.existsSync('.env.json'), //eslint-disable-line no-sync
    FILE_ID = 'index';

if (!configExists) {
    console.error(FILE_ID, 'No .env.json file detected, booting aborted...');
} else {
    const logger = require('./core/logger');

    require('dot-env');
    logger.log(FILE_ID, '.env.json file detected and loaded...');

    require('./core/db');
    require('./core/http-server').boot();
}
