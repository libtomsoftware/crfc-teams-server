const fs = require('fs-extra'),
    configExists = fs.existsSync('.env.json'), //eslint-disable-line no-sync
    FILE_ID = 'index';

if (!configExists) {
    console.error(FILE_ID, 'No .env.json file detected, booting aborted...');
} else {
    require('dot-env');
    require('./core/');
    require('./api/');

    let logger = require('./core/logger');
    logger.log(FILE_ID, '.env.json file detected and loaded...');
}

module.exports = this;
