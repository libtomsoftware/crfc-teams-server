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
    return item.name === dataFromRequest.name && item.agegroup === dataFromRequest.agegroup;
}

function onTeamsRetrieve(error, result, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving teams: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };
    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK,
        data: {
            teams: result
        }
    });
}

function retrieveTeams(request, response) {
    dbFind('teams', null, (error, result) => {
        onTeamsRetrieve(error, result, response);
    });
}

function addTeam(request, response) {
    const teamDataFromRequest = Object.assign({}, request.body, {
        _id: helpers.generateRandomId()
    });

    dbFind('teams', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving teams: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const dataFromRequest = Object.assign({}, request.body);
        const team = result.find(item => {
            return hasConflictConditions(item, dataFromRequest);
        });

        if (team) {
            responder.rejectConflict(response);
            return;
        }

        dbInsert('teams',
            teamDataFromRequest,
            (status) => {
                if (status === 200) {
                    retrieveTeams(request, response);
                } else {
                    responder.send(response, {
                        status
                    });
                }
            }
        );

    });


}

function removeTeam(request, response) {
    dbDelete('teams',
        {
            _id: request.params.id
        },
        (promise) => {
            promise
                .then(() => {
                    retrieveTeams(request, response);
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

function updateTeam(request, response) {
    dbFind('teams', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving teams: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const updateFromRequest = Object.assign({}, request.body);
        const team = result.find(item => {
            return item._id === updateFromRequest._id;
        });

        if (!team) {
            responder.rejectNotFound(response);
            return;
        }

        const dataToSave = Object.assign({}, team, updateFromRequest);

        dbSave('teams',
          dataToSave,
          (status) => {
              if (status === 200) {
                retrieveTeams(request, response);
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

module.exports = new class TeamsResource {

    get(request, response) {
        checkIfTokenValid(request, response, retrieveTeams);
    }

    post(request, response) {
        if (!request.body || !request.body._id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, updateTeam);
    }

    put(request, response) {
        if (!request.body) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, addTeam);
    }

    delete(request, response) {
        if (!request.params || !request.params.id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, removeTeam);
    }
};
