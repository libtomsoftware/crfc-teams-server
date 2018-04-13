const responder = require('./common/responder'),
    parser = require('./common/parser'),
    logger = require('../logger'),
    endpoints = [
        'healthcheck'
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

        this.extend = this.extend.bind(this);
        this.handle = this.handle.bind(this);
    }

    extend(endpoint, resource) {
        if (!this.resources[endpoint]) {
            logger.log(FILE_ID, `Extending API with ${endpoint}`);
            this.resources[endpoint] = resource;
        }
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

