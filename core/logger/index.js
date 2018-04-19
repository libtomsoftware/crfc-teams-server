'use strict';

const chalk = require('chalk'),
    warning = chalk.keyword('orange'),
    helpers = require('../helpers'),
    http = require('../http'),
    ROOT_PATH = process.cwd(),
    PACKAGE_CONFIG = require(ROOT_PATH + '/package.json'),
    appId = process.env.APP_ID || PACKAGE_CONFIG.name,
    noop = () => {};

module.exports = new class Logger {
    error(fileId, message) {
        console.log(chalk.black.bgRedBright(` ${fileId} `), chalk.redBright(`${helpers.currentTimestamp} ${message}`));
    }

    warn(fileId, message) {
        console.log(warning(`${helpers.currentTimestamp} [${fileId}]`), chalk.yellow(message));
    }

    log(fileId, message) {
        console.log(chalk.gray(`${helpers.currentTimestamp} [${fileId}] ${message}`));
    }

    info(fileId, message) {
        console.log(chalk.cyan(`${helpers.currentTimestamp} [${fileId}] ${message}`));
    }

};
