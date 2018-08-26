'use strict';

function encodeBase64(text) {
    return Buffer.from(text).toString('base64');
}

module.exports = new class Helpers {
    isArray(object) {
        return Object.prototype.toString.call(object) === '[object Array]';
    }

    extractIp(request) {
        return request.headers['x-forwarded-for'] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress;
    }

    generateRandomId() {
        return encodeBase64(Math.random().toString(36).slice(2) + (new Date()).getTime());
    }

    get currentTimestamp() {
        return new Date().getTime();
    }
}

