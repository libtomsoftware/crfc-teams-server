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
    return item.name === dataFromRequest.name;
}

function onGameStatesRetrieve(error, result, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving gamestates: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };
    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK,
        data: {
            gamestates: result
        }
    });
}

function retrieveGameStates(request, response) {
    dbFind('gamestates', null, (error, result) => {
        onGameStatesRetrieve(error, result, response);
    });
}

function addGameState(request, response) {
    const gamestateDataFromRequest = Object.assign({}, request.body, {
        _id: helpers.generateRandomId()
    });

    dbFind('gamestates', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving gamestates: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const dataFromRequest = Object.assign({}, request.body);
        const gamestate = result.find(item => {
            return hasConflictConditions(item, dataFromRequest);
        });

        if (gamestate) {
            responder.rejectConflict(response);
            return;
        }

        dbInsert('gamestates',
            gamestateDataFromRequest,
            (status) => {
                if (status === 200) {
                    retrieveGameStates(request, response);
                } else {
                    responder.send(response, {
                        status
                    });
                }
            }
        );

    });

}

function removeGameState(request, response) {
    dbDelete('gamestates',
        {
            _id: request.params.id
        },
        (promise) => {
            promise
                .then(() => {
                    retrieveGameStates(request, response);
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

function updateGameState(request, response) {
    dbFind('gamestates', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving gamestates: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const updateFromRequest = Object.assign({}, request.body);
        const gamestate = result.find(item => {
            return item._id === updateFromRequest._id;
        });

        if (!gamestate) {
            responder.rejectNotFound(response);
            return;
        }

        const dataToSave = Object.assign({}, gamestate, updateFromRequest);

        dbSave('gamestates',
          dataToSave,
          (status) => {
              if (status === 200) {
                retrieveGameStates(request, response);
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

module.exports = new class GameStatesResource {

    get(request, response) {
        checkIfTokenValid(request, response, retrieveGameStates);
    }

    post(request, response) {
        if (!request.body || !request.body._id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, updateGameState);
    }

    put(request, response) {
        if (!request.body) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, addGameState);
    }

    delete(request, response) {
        if (!request.params || !request.params.id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, removeGameState);
    }
};
