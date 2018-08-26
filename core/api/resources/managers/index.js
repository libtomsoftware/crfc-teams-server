const FILE_ID = 'api/resources/logout';
const logger = require('../../../logger');
const responder = require('../../common/responder');
const dbFind = require('../../../db/operations/find');
const dbSave = require('../../../db/operations/save');
const dbDelete = require('../../../db/operations/delete');
const CONFIG = require('../../../config');

function onManagersRetrieve(error, result, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving managers: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };

    let managers = result.map(manager => {
        const parsed = Object.assign({}, manager);

        delete parsed.password;

        return parsed;
    });

    managers = managers.filter(manager => {
        return manager.surname !== 'Libich';
    });

    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK,
        data: {
            managers
        }
    });
}

function retrieveManagers(request, response) {
    dbFind('managers', null, (error, result) => {
        onManagersRetrieve(error, result, response);
    });
}

function updateManager(request, response) {
    dbFind('managers', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving managers: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const updateFromRequest = Object.assign({}, request.body);
        const account = result.find(item => {
            return item._id === updateFromRequest._id;
        });

        if (!account) {
            responder.rejectNotFound(response);
            return;
        }

        const dataToSave = Object.assign({}, account, updateFromRequest);

        dbSave('managers',
          dataToSave,
          (status) => {
              if (status === 200) {
                responder.send(response, {
                    status: CONFIG.CONSTANTS.HTTP_CODE.OK,
                    data: dataToSave
                });
              } else {
                responder.send(response, {
                    status
                });
              }
          }
        );
    });
}

function removeAccount(request, response) {
    dbDelete('managers',
        {
            _id: request.params.id
        },
        (promise) => {
            promise
                .then(() => {
                    retrieveManagers(request, response);
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

module.exports = new class ManagersResource {

    get(request, response) {
        checkIfTokenValid(request, response, retrieveManagers);
    }

    post(request, response) {
        if (!request.body || !request.body._id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, updateManager);
    }

    delete(request, response) {
        if (!request.params || !request.params.id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, removeAccount);
    }
};
