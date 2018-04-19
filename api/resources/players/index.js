const moment = require('moment'),
    responder = require('../../common/responder'),
    CONFIG = require('../../../core/config'),
    players = require('../../../players');

module.exports = new class PlayersResource {

    get(request, response) {
        players.find((error, data) => {
            if (error) {
                responder.reject();
                return;
            }

            responder.send(response, {
                status: CONFIG.CONSTANTS.HTTP_CODE.OK,
                data
            });
        });
    }

};
