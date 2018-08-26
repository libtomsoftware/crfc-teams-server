const FILE_ID = 'api/resources/login';
const crypto = require('crypto');
const logger = require('../../../logger');
const responder = require('../../common/responder');
const dbFind = require('../../../db/operations/find');
const dbSave = require('../../../db/operations/save');
const cryptoSecret = process.env.CRYPTO_SECRET;

function encodeBase64(text) {
    return Buffer.from(text).toString('base64');
}

function encrypt(text) {
  return crypto
    .createHmac('sha256', cryptoSecret)
    .update(text)
    .digest('hex')
}

function onTokenSave(status) {
  if (status !== 200) {
    logger.error(FILE_ID, `Error while saving auth token: ${error}`);
    return;
  };
}

function onTokenRetrieve(error, result, username, token, timestamp) {
  if (error) {
    logger.error(FILE_ID, `Error while retrieving auth tokens: ${error}`);
    return;
  };

  const tokens = result[0] ? result[0].tokens : [];

  tokens.push({
    username,
    timestamp,
    token
  });

  dbSave('auth', {
    _id: 'tokens',
    tokens
  }, onTokenSave);
}

function updateTokens(username, token, timestamp) {
  dbFind(
    'auth',
    {
      _id: 'tokens'
    },
    (error, result) => {
      onTokenRetrieve(error, result, username, token, timestamp)
    });
}

function generateToken(username, rank) {
    const timestamp = (new Date()).getTime();
    const token = encodeBase64('@@@' + username + '@@@' + rank + '@@@' + timestamp);

    updateTokens(username, token, timestamp);

    return token;
}

function onAccountCheck(error, result, password, response) {
  if (error) {
    responder.rejectBadGateway(response);
    return;
  }

  const account = result[0];

  if (!account) {
    responder.rejectUnauthorized(response);
    return;
  }

  const encryptedPasswordFromRequest = encrypt(password);

  if (account.password !== encryptedPasswordFromRequest) {
    responder.rejectUnauthorized(response);
    return;
  }

  const encryptedUsernameFromRequest = encrypt(account.username);
  const token = generateToken(encryptedUsernameFromRequest, account.rank);
  const { firstname, surname, username, rank, _id } = account;

  responder.send(response, {
    status: 200,
    data: {
      _id,
      firstname,
      surname,
      email: account.username,
      rank
    },
    cookie: {
      name: 'footy-token',
      value: token
    }
  });
}

function checkIfAccountExists(username, password, response) {
  dbFind(
    'managers',
    {
      username
    },
    (error, result) => {
      onAccountCheck(error, result, password, response);
  });
}

module.exports = new class LoginResource {
    post(request, response) {
      const body = request.body;

      if (body && body.username && body.password) {
        checkIfAccountExists(body.username, body.password, response);
      } else {
        responder.reject(response);
      }
  }
};