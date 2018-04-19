const moment = require('moment'),
    responder = require('../../common/responder'),
    CONFIG = require('../../../core/config');

module.exports = new class PlayersResource {

    get(request, response) {
        responder.send(response, {
            status: CONFIG.CONSTANTS.HTTP_CODE.OK,
            data: Object.assign({}, CONFIG.APP, {
                time: moment().format()
            })
        });
    }

};
