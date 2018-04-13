'use strict';

module.exports = new class Helpers {
    isArray(object) {
        return Object.prototype.toString.call(object) === '[object Array]';
    }

    extractIp(request) {
        return request.headers['x-forwarded-for'] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress;
    }

    get currentTimestamp() {
        return new Date().getTime();
    }
}

