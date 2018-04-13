const moment = require('moment'),
    responder = require('../../common/responder'),
    CONFIG = require('../../../config');

module.exports = new class HealthcheckResource {

    get(request, response) {
        responder.send(response, {
            status: CONFIG.CONSTANTS.HTTP_CODE.OK,
            data: Object.assign({}, CONFIG.APP, {
                time: moment().format()
            })
        });
    }

};
