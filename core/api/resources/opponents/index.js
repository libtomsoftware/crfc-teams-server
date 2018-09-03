const FILE_ID = 'api/resources/logout';
const logger = require('../../../logger');
const responder = require('../../common/responder');
const dbFind = require('../../../db/operations/find');
const dbInsert = require('../../../db/operations/insert');
const dbSave = require('../../../db/operations/save');
const dbDelete = require('../../../db/operations/delete');
const CONFIG = require('../../../config');
const helpers = require('../../../helpers');

function hasConflictConditions(item, dataFromRequest) {
    return item.name === dataFromRequest.name && item.description === dataFromRequest.description;
}

function onOpponentsRetrieve(error, result, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving opponents: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };
    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK,
        data: {
            opponents: result
        }
    });
}

function retrieveOpponents(request, response) {
    dbFind('opponents', null, (error, result) => {
        onOpponentsRetrieve(error, result, response);
    });
}

function addOpponent(request, response) {
    const opponentDataFromRequest = Object.assign({}, request.body, {
        _id: helpers.generateRandomId()
    });

    dbFind('opponents', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving opponents: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const dataFromRequest = Object.assign({}, request.body);
        const opponent = result.find(item => {
            return hasConflictConditions(item, dataFromRequest);
        });

        if (opponent) {
            responder.rejectConflict(response);
            return;
        }

        dbInsert('opponents',
            opponentDataFromRequest,
            (status) => {
                if (status === 200) {
                    retrieveOpponents(request, response);
                } else {
                    responder.send(response, {
                        status
                    });
                }
            }
        );

    });

}

function removeOpponent(request, response) {
    dbDelete('opponents',
        {
            _id: request.params.id
        },
        (promise) => {
            promise
                .then(() => {
                    retrieveOpponents(request, response);
                })
                .catch(error => {
                    responder.send(response, {
                        status: 500,
                        data: error
                    });
                });
        }
    );
}

function updateOpponent(request, response) {
    dbFind('opponents', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving opponents: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const updateFromRequest = Object.assign({}, request.body);
        const opponent = result.find(item => {
            return item._id === updateFromRequest._id;
        });

        if (!opponent) {
            responder.rejectNotFound(response);
            return;
        }

        const dataToSave = Object.assign({}, opponent, updateFromRequest);

        dbSave('opponents',
          dataToSave,
          (status) => {
              if (status === 200) {
                retrieveOpponents(request, response);
              } else {
                responder.send(response, {
                    status
                });
              }
          }
        );
    });
}

function onTokenRetrieve(error, result, token, request, response, onTokenValidCallback) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving auth tokens: ${error}`);
      return;
    };

    const tokens = result[0] ? result[0].tokens : [];

    if (!tokens.length) {
        responder.rejectUnauthorized(response);
        return;
    }

    const isTokenValid = tokens.find(item => {
        return item.token === token;
    });

    if (!isTokenValid) {
        responder.rejectUnauthorized(response);
        return;
    }

    onTokenValidCallback(request, response);
}

function getTokenFromCookie(request) {
    const cookies = request.cookies;

    return cookies['footy-token'];
}

function checkIfTokenValid(request, response, onTokenValidCallback) {
    const tokenFromCookie = getTokenFromCookie(request);

    if (!tokenFromCookie) {
        responder.rejectUnauthorized(response);
        return;
    }

    dbFind(
        'auth',
        {
          _id: 'tokens'
        },
        (error, result) => {
          onTokenRetrieve(error, result, tokenFromCookie, request, response, onTokenValidCallback)
        });
}

module.exports = new class OpponentsResource {

    get(request, response) {
        checkIfTokenValid(request, response, retrieveOpponents);
    }

    post(request, response) {
        if (!request.body || !request.body._id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, updateOpponent);
    }

    put(request, response) {
        if (!request.body) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, addOpponent);
    }

    delete(request, response) {
        if (!request.params || !request.params.id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, removeOpponent);
    }
};
