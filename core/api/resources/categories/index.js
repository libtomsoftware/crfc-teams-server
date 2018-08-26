const FILE_ID = 'api/resources/logout';
const logger = require('../../../logger');
const responder = require('../../common/responder');
const dbFind = require('../../../db/operations/find');
const dbInsert = require('../../../db/operations/insert');
const dbSave = require('../../../db/operations/save');
const dbDelete = require('../../../db/operations/delete');
const CONFIG = require('../../../config');
const helpers = require('../../../helpers');

function onCategoriesRetrieve(error, result, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving categories: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };
    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK,
        data: {
            categories: result
        }
    });
}

function retrieveCategories(request, response) {
    dbFind('categories', null, (error, result) => {
        onCategoriesRetrieve(error, result, response);
    });
}

function addCategory(request, response) {
    const categoryDataFromRequest = Object.assign({}, request.body, {
        _id: helpers.generateRandomId()
    });

    dbFind('categories', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving categories: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const dataFromRequest = Object.assign({}, request.body);
        const category = result.find(item => {
            return item.symbol === dataFromRequest.symbol;
        });

        if (category) {
            responder.rejectConflict(response);
            return;
        }

        dbInsert('categories',
            categoryDataFromRequest,
            (status) => {
                if (status === 200) {
                    retrieveCategories(request, response);
                } else {
                    responder.send(response, {
                        status
                    });
                }
            }
        );

    });


}

function removeCategory(request, response) {
    dbDelete('categories',
        {
            _id: request.params.id
        },
        (promise) => {
            promise
                .then(() => {
                    retrieveCategories(request, response);
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

function updateCategory(request, response) {
    dbFind('categories', null, (error, result) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving categories: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        const updateFromRequest = Object.assign({}, request.body);
        const category = result.find(item => {
            return item._id === updateFromRequest._id;
        });

        if (!category) {
            responder.rejectNotFound(response);
            return;
        }

        const dataToSave = Object.assign({}, category, updateFromRequest);

        dbSave('categories',
          dataToSave,
          (status) => {
              if (status === 200) {
                retrieveCategories(request, response);
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

module.exports = new class CategoriesResource {

    get(request, response) {
        checkIfTokenValid(request, response, retrieveCategories);
    }

    post(request, response) {
        if (!request.body || !request.body._id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, updateCategory);
    }

    put(request, response) {
        if (!request.body) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, addCategory);
    }

    delete(request, response) {
        if (!request.params || !request.params.id) {
            responder.reject(response);
            return;
        }

        checkIfTokenValid(request, response, removeCategory);
    }
};
