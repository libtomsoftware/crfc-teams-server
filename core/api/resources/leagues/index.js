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
    return item.fullname === dataFromRequest.fullname;
}

function onLeaguesRetrieve(error, result, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving leagues: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };
    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK,
        data: {
            leagues: result
        }
    });
}

function retrieveLeagues(request, response) {
    dbFind('leagues', null, (error, result) => {
        onLeaguesRetrieve(error, result, response);
    });
}

function addLeague(request, response) {
    const leagueDataFromRequest = Object.assign({}, request.body, {
        _id: helpers.generateRandomId()
    });

    dbFind('leagues', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving leagues: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const dataFromRequest = Object.assign({}, request.body);
        const league = result.find(item => {
            return hasConflictConditions(item, dataFromRequest);
        });

        if (league) {
            responder.rejectConflict(response);
            return;
        }

        dbInsert('leagues',
            leagueDataFromRequest,
            (status) => {
                if (status === 200) {
                    retrieveLeagues(request, response);
                } else {
                    responder.send(response, {
                        status
                    });
                }
            }
        );

    });

}

function removeLeague(request, response) {
    dbDelete('leagues',
        {
            _id: request.params.id
        },
        (promise) => {
            promise
                .then(() => {
                    retrieveLeagues(request, response);
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

function updateLeague(request, response) {
    dbFind('leagues', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving leagues: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const updateFromRequest = Object.assign({}, request.body);
        const league = result.find(item => {
            return item._id === updateFromRequest._id;
        });

        if (!league) {
            responder.rejectNotFound(response);
            return;
        }

        const dataToSave = Object.assign({}, league, updateFromRequest);

        dbSave('leagues',
          dataToSave,
          (status) => {
              if (status === 200) {
                retrieveLeagues(request, response);
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

module.exports = new class LeaguesResource {

    get(request, response) {
        checkIfTokenValid(request, response, retrieveLeagues);
    }

    post(request, response) {
        if (!request.body || !request.body._id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, updateLeague);
    }

    put(request, response) {
        if (!request.body) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, addLeague);
    }

    delete(request, response) {
        if (!request.params || !request.params.id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, removeLeague);
    }
};
