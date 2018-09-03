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

function onGameResultsRetrieve(error, result, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving gameresults: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };
    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK,
        data: {
            gameresults: result
        }
    });
}

function retrieveGameResults(request, response) {
    dbFind('gameresults', null, (error, result) => {
        onGameResultsRetrieve(error, result, response);
    });
}

function addGameResult(request, response) {
    const gameresultDataFromRequest = Object.assign({}, request.body, {
        _id: helpers.generateRandomId()
    });

    dbFind('gameresults', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving gameresults: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const dataFromRequest = Object.assign({}, request.body);
        const gameresult = result.find(item => {
            return hasConflictConditions(item, dataFromRequest);
        });

        if (gameresult) {
            responder.rejectConflict(response);
            return;
        }

        dbInsert('gameresults',
            gameresultDataFromRequest,
            (status) => {
                if (status === 200) {
                    retrieveGameResults(request, response);
                } else {
                    responder.send(response, {
                        status
                    });
                }
            }
        );

    });

}

function removeGameResult(request, response) {
    dbDelete('gameresults',
        {
            _id: request.params.id
        },
        (promise) => {
            promise
                .then(() => {
                    retrieveGameResults(request, response);
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

function updateGameResult(request, response) {
    dbFind('gameresults', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving gameresults: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const updateFromRequest = Object.assign({}, request.body);
        const gameresult = result.find(item => {
            return item._id === updateFromRequest._id;
        });

        if (!gameresult) {
            responder.rejectNotFound(response);
            return;
        }

        const dataToSave = Object.assign({}, gameresult, updateFromRequest);

        dbSave('gameresults',
          dataToSave,
          (status) => {
              if (status === 200) {
                retrieveGameResults(request, response);
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

module.exports = new class GameResultsResource {

    get(request, response) {
        checkIfTokenValid(request, response, retrieveGameResults);
    }

    post(request, response) {
        if (!request.body || !request.body._id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, updateGameResult);
    }

    put(request, response) {
        if (!request.body) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, addGameResult);
    }

    delete(request, response) {
        if (!request.params || !request.params.id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, removeGameResult);
    }
};
