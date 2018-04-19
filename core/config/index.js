const ENV = process.env, //eslint-disable-line one-var
    ROOT_PATH = process.cwd(),
    PACKAGE_CONFIG = require(ROOT_PATH + '/package.json'),
    APP_HTTP_PORT = ENV.APP_HTTP_PORT || 4000,
    APP_URL = ENV.APP_IP || 'localhost',
    APP = {
        ADDRESS: {
            HTTP_PORT: APP_HTTP_PORT,
            URL: APP_URL
        },
        NAME: PACKAGE_CONFIG.name
    };

module.exports = {
    APP: Object.assign({}, APP, {
        ID: ENV.APP_ID || `${PACKAGE_CONFIG.name}@${APP.ADDRESS.URL}:${APP.ADDRESS.HTTP_PORT}`
    }),
    CONSTANTS: {
        HTTP_CODE: {
            OK: 200,
            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            FORBIDDEN: 403,
            NOT_FOUND: 404,
            CONFLICT: 409,
            INTERNAL_SERVER_ERROR: 500,
            BAD_GATEWAY: 502
        }
    },
    URL: {}
};

