const CONFIG = require('../../config'),
    STATUS_CODE = CONFIG.CONSTANTS.HTTP_CODE;

module.exports = new class Responder {

    constructor() {
        this.badRequestParams = {
            status: STATUS_CODE.BAD_REQUEST,
            error: 'Bad request',
            type: 'text/plain'
        };

        this.badGatewayParams = {
            status: STATUS_CODE.BAD_GATEWAY,
            error: 'bad gateway'
        };

        this.conflictParams = {
            status: STATUS_CODE.CONFLICT,
            error: 'Entry exists',
            type: 'text/plain'
        };

        this.unauthorizedRequestParams = {
            status: STATUS_CODE.UNAUTHORIZED,
            error: 'Unauthorized',
            type: 'text/plain'
        };

        this.notFoundParams = {
            status: STATUS_CODE.NOT_FOUND,
            error: 'not found'
        };
    }

    send(response, params) {
        if (response) {
            if (params.status >= STATUS_CODE.OK && params.status < 300) {
                if (params.cookie && params.cookie.name) {
                    const cookie = params.cookie;
                    response.cookie(cookie.name, cookie.value, {
                        expires: cookie.expires || new Date(Date.now() + 3600000), // 1 hour
                        httpOnly: cookie.httpOnly || false
                    });
                }
                if (params.data) {
                    response.json(params.data);
                } else {
                    response.end();
                }
            } else {
                response.writeHead(params.status, {
                    'Content-Type': 'text/plain'
                });
                if (params.message || (params.data && params.data.message)) {
                    response.end(params.message || params.data.message);
                } else if (params.error) {
                    response.end(params.error);
                } else {
                    response.end();
                }
            }
        }
    }

    reject(response, silent) {
        this.send(response, this.badRequestParams, silent);
    }

    rejectNotFound(response) {
        this.send(response, this.notFoundParams);
    }

    rejectBadGateway(response) {
        this.send(response, this.badGatewayParams);
    }

    rejectConflict(response) {
        this.send(response, this.conflictParams);
    }

    rejectUnauthorized(response) {
        this.send(response, this.unauthorizedRequestParams);
    }

}
