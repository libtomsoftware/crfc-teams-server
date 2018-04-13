const CONFIG = require('../config');

module.exports = function (request, response, next) {
    response.send(`${CONFIG.APP.ID}`);
    next();
};
