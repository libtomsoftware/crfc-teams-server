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
    return item.abbreviation === dataFromRequest.abbreviation;
}

function onAgeGroupsRetrieve(error, result, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving agegroups: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };
    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK,
        data: {
            agegroups: result
        }
    });
}

function retrieveAgeGroups(request, response) {
    dbFind('agegroups', null, (error, result) => {
        onAgeGroupsRetrieve(error, result, response);
    });
}

function addAgeGroup(request, response) {
    const agegroupDataFromRequest = Object.assign({}, request.body, {
        _id: helpers.generateRandomId()
    });

    dbFind('agegroups', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving agegroups: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const dataFromRequest = Object.assign({}, request.body);
        const agegroup = result.find(item => {
            return hasConflictConditions(item, dataFromRequest);
        });

        if (agegroup) {
            responder.rejectConflict(response);
            return;
        }

        dbInsert('agegroups',
            agegroupDataFromRequest,
            (status) => {
                if (status === 200) {
                    retrieveAgeGroups(request, response);
                } else {
                    responder.send(response, {
                        status
                    });
                }
            }
        );
    });
}

function removeAgeGroup(request, response) {
    dbDelete('agegroups',
        {
            _id: request.params.id
        },
        (promise) => {
            promise
                .then(() => {
                    retrieveAgeGroups(request, response);
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

function updateAgeGroup(request, response) {
    dbFind('agegroups', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving agegroups: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const updateFromRequest = Object.assign({}, request.body);
        const agegroup = result.find(item => {
            return item._id === updateFromRequest._id;
        });

        if (!agegroup) {
            responder.rejectNotFound(response);
            return;
        }

        const dataToSave = Object.assign({}, agegroup, updateFromRequest);

        dbSave('agegroups',
          dataToSave,
          (status) => {
              if (status === 200) {
                retrieveAgeGroups(request, response);
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

module.exports = new class AgeGroupsResource {

    get(request, response) {
        checkIfTokenValid(request, response, retrieveAgeGroups);
    }

    post(request, response) {
        if (!request.body || !request.body._id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, updateAgeGroup);
    }

    put(request, response) {
        if (!request.body) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, addAgeGroup);
    }

    delete(request, response) {
        if (!request.params || !request.params.id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, removeAgeGroup);
    }
};
