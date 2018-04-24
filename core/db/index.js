const setup = require('./setup'),
    logger = require('../logger'),
    CONFIG = require('../config'),
    FILE_ID = 'db',
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

    insert(collectionId, query, callback) {
        CONFIG.DB.CLIENT.connect(CONFIG.DB.URL, (error, client) => {
            if (error) {
                logger.error(FILE_ID, `Database connection error: ${error}`);
                return;
            }

            const db = client.db(CONFIG.DB.NAME);
            const collection = db.collection(collectionId);

            const player = Object.assign({}, {
                _id: Date.now().toString()
            }, query);

            logger.info(FILE_ID, `Adding new player: ${player.firstname} ${player.lastname}`);

            collection.insert(player, callback);

            client.close();
        });
    };

    remove(collectionId, id, callback) {
        CONFIG.DB.CLIENT.connect(CONFIG.DB.URL, (error, client) => {
            if (error) {
                logger.error(FILE_ID, `Database connection error: ${error}`);
                return;
            }

            const db = client.db(CONFIG.DB.NAME);
            const collection = db.collection(collectionId);

            collection.find({
                _id: id
            }).toArray((error, result) => {
                if (error) {
                    callback(error, {});
                } else {
                    const player = result[0];

                    logger.info(FILE_ID, `Removing player: ${player.firstname} ${player.lastname}`);
                    
                    collection.remove({
                        _id: id
                    }, callback);
                }

                client.close();
            });

        });
    };
};