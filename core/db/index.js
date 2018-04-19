const setup = require('./setup'),
    CONFIG = require('../config'),
    assert = require('assert');

module.exports = new class DB {
    init(mongodb) {
        setup.init(mongodb);
    }

    find(collectionId, query, callback) {
        CONFIG.DB.CLIENT.connect(CONFIG.DB.URL, (error, client) => {
            if (error) {
                logger.error(FILE_ID, `Database connection error: ${error}`);
                return;
            }

            const db = client.db(CONFIG.DB.NAME);
            const collection = db.collection(collectionId);

            collection.find(query || {}).toArray(callback);

            client.close();
        });
    }
};