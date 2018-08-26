const crypto = require('crypto');
const responder = require('../../common/responder');
const dbFind = require('../../../db/operations/find');
const dbInsert = require('../../../db/operations/insert');
const helpers = require('../../../helpers');
const cryptoSecret = process.env.CRYPTO_SECRET;

const ALPHABETIC_ONLY = /^\D+/g;
const ALPHANUMERIC_ONLY = /^[a-z0-9]+$/i;
const VALID_EMAIL = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;



function encrypt(text) {
  return crypto
    .createHmac('sha256', cryptoSecret)
    .update(text)
    .digest('hex')
}

function isEmpty(text) {
  return !text || text.length === 0;
}

function isValidEmail(email) {
  return VALID_EMAIL.test(String(email).toLowerCase());
}

function isValidPassword(password) {
  const hasAnyNumber = password.replace(ALPHABETIC_ONLY, '').length > 0;

  return password.length > 7 && password.length < 16 && ALPHANUMERIC_ONLY.test(String(password).toLowerCase()) && hasAnyNumber;
}

function isUserDataInvalid(userData) {
  const { username, password, firstname, surname } = userData;

  return !isValidEmail(username) || !isValidPassword(password) || isEmpty(firstname) || isEmpty(surname);
}

function onAccountInsert(status, response) {
  responder.send(response, {
      status
  });
}

function onAccountCheck(error, result, response, userData) {
  if (error) {
    responder.rejectBadGateway(response);
    return;
  }

  if (result.length) {
    responder.rejectConflict(response);
    return;
  }

  dbInsert('managers', Object.assign({}, userData, {
    _id: helpers.generateRandomId(),
    rank: 2
  }), (status) => {
    onAccountInsert(status, response);
  });
}

function checkIfAccountExists(response, userData) {
  dbFind(
    'managers',
    {
      username: userData.username
    },
    (error, result) => {
      onAccountCheck(error, result, response, userData);
  });
}

module.exports = new class RegisterResource {
    put(request, response) {
      const body = request.body;

      if (body && !isUserDataInvalid(body)) {

        checkIfAccountExists(response, Object.assign({}, body, {
          password: encrypt(body.password)
        }));

      } else {
        responder.reject(response);
      }
  }
};