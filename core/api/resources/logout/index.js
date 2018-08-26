const FILE_ID = 'api/resources/logout';
const logger = require('../../../logger');
const responder = require('../../common/responder');
const dbFind = require('../../../db/operations/find');
const dbSave = require('../../../db/operations/save');
const CONFIG = require('../../../config');

function onTokenSave(status, response) {
    if (status !== 200) {
      logger.error(FILE_ID, `Error while saving auth token: ${error}`);
      return;
    };

    responder.send(response, {
        status: CONFIG.CONSTANTS.HTTP_CODE.OK
    });
  }

function onTokenRetrieve(error, result, token, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving auth tokens: ${error}`);
      return;
    };

    let tokens = result[0] ? result[0].tokens : [];

    if (!tokens.length) {
        responder.reject(response);
        return;
    }

    tokens = tokens.filter(item => {
        return item.token !== token;
    });

    dbSave('auth', {
      _id: 'tokens',
      tokens
    }, (status) => {
        onTokenSave(status, response);
    });
}

module.exports = new class LogoutResource {

    delete(request, response) {
        const cookies = request.cookies;
        const token = cookies['footy-token'];

        if (!token) {
            responder.reject(response);
            return;
        }

        dbFind(
            'auth',
            {
              _id: 'tokens'
            },
            (error, result) => {
              onTokenRetrieve(error, result, token, response)
            });
    }

};
