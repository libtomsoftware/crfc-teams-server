const logger = require('../../logger'),
  CONFIG = require('../../config'),
  FILE_ID = 'db/operations/find';

module.exports = function(collectionId, query, callback) {
  CONFIG.DB.CLIENT.connect(
      `${CONFIG.DB.URL}/${CONFIG.DB.NAME}`,
      {
        useNewUrlParser: true
      },
      (error, client) => {
        if (error) {
            logger.error(FILE_ID, `Database connection error: ${error}`);
            return;
        }

        const db = client.db(CONFIG.DB.NAME);
        const collection = db.collection(collectionId);

        callback(collection.remove(query));

        client.close();
  });
};