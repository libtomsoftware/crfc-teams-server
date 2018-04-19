const responder = require('./common/responder'),
    parser = require('./common/parser'),
    logger = require('../core/logger'),
    endpoints = [
        'healthcheck',
        'players'
    ],
    FILE_ID = 'api';

module.exports = new class Api {
    constructor() {
        this.responder = responder;
        this.parser = parser;
        this.resources = {};

        endpoints.forEach(endpoint => {
            this.resources[endpoint] = require('./resources/' + endpoint);
        });

        this.handle = this.handle.bind(this);
    }

    handle(request, response) {
        const resource = request.params ? request.params.resource : undefined,
            isApiRoute = request.url.indexOf('/api/') !== -1,
            requestMethod = request.method.toLowerCase();

        if (isApiRoute && resource) {
            if (this.resources[resource] && this.resources[resource][requestMethod]) {
                this.resources[resource][requestMethod](request, response);
            } else {
                this.responder.reject(response);
            }
        } else {
            this.responder.reject(response);
        }
    }
}

