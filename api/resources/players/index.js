const moment = require('moment'),
    responder = require('../../common/responder'),
    parser = require('../../common/parser'),
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

    put(request, response) {
        const data = parser.parsePostData(request.body.json);

        players.insert(data, (error, data) => {
            responder.send(response, {
                status: CONFIG.CONSTANTS.HTTP_CODE.OK,
                data
            });
        });
    }

    delete(request, response) {
        players.delete(request.params.id, (error, data) => {
            responder.send(response, {
                status: CONFIG.CONSTANTS.HTTP_CODE.OK,
                data
            });
        });
    }

};
