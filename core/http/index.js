'use strict';

const request = require('request'),
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    agentOptions = {
        rejectUnauthorized: false
    },
    CONFIG = require('../config');

function updateHeaders(optionsHeaders) {
    return Object.assign({}, headers, optionsHeaders);
}

function updateBody(body) {
    return typeof body !== 'string' ? JSON.stringify(Object.assign({}, body)) : body;
}

function send(method, options) {
    return new Promise((resolve, reject) => {
        options = Object.assign({}, options, {
            method,
            agentOptions
        });

        options.headers = updateHeaders(options.headers);

        if (options.body) {
            options.body = updateBody(options.body);
        }

        request(options, (error, response) => {
            if (error || response.statusCode !== CONFIG.CONSTANTS.HTTP_CODE.OK) {
                reject(error || response.statusCode);
                return;
            }

            if (response.body && typeof response.body === 'string') {
                response.body = JSON.parse(response.body);
            }

            resolve(response.body);
        });
    });
}

module.exports = new class Http {

    get(options) {
        return send('GET', options);
    }

    post(options) {
        return send('POST', options);
    }

    put(options) {
        return send('PUT', options);
    }

    delete(options) {
        return send('DELETE', options);
    }
};
