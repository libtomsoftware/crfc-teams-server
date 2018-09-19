module.exports = function (request, response, next) {
    const origin = request.headers.origin;
    const allowedOrigins = [
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'http://crfcapp.libtom.com',
        'https://crfcapp.libtom.com',
        'http://cassioburyrangersfc.co.uk',
        'https://cassioburyrangersfc.co.uk'
    ]

    if ( allowedOrigins.includes(origin) ) {
        response.header('Access-Control-Allow-Origin', origin);
    }

    response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    response.header('Access-Control-Allow-Credentials', 'true');

    if (request.method.toLowerCase() === 'options') {
        response.sendStatus(200);
    } else {
        next();
    }
};
