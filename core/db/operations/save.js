const logger = require('../../logger'),
  CONFIG = require('../../config'),
  FILE_ID = 'db/operations/save',
  STATUS_CODE = CONFIG.CONSTANTS.HTTP_CODE;

function onSave(error, resCallback) {
    if (error) {
        resCallback(CONFIG.CONSTANTS.HTTP_CODE.INTERNAL_SERVER_ERROR);
        return;
    }
    resCallback(STATUS_CODE.OK);
}

function onConnect(error, client, collectionId, query, resCallback) {
    if (error) {
        logger.error(FILE_ID, `Database connection error: ${error}`);
        resCallback(CONFIG.CONSTANTS.HTTP_CODE.INTERNAL_SERVER_ERROR);
        return;
    }

    if (query) {
        const db = client.db(CONFIG.DB.NAME);
        const collection = db.collection(collectionId);

        collection.save(query, () => {
            onSave(error, resCallback)
        });

        client.close();
        return;
    }

    resCallback(STATUS_CODE.BAD_REQUEST);
}

module.exports = function(collectionId, query, resCallback) {
    CONFIG.DB.CLIENT.connect(
        `${CONFIG.DB.URL}/${CONFIG.DB.NAME}`,
        {
            useNewUrlParser: true
        },
        (error, client) => {
            onConnect(error, client, collectionId, query, resCallback);
        }
    );
};