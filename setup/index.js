const api = require('../api'),
    CONFIG = require('../config'),
    logger = require('../logger'),
    FILE_ID = 'setup',
    ENV = process.env,
    dbAddress = ENV.MONGODB_ADDRESS,
    dbUser = ENV.MONGODB_USER,
    dbPassword = ENV.MONGODB_PASSWORD;

module.exports = new class MongodBSetup {
    init(mongodb) {
        if (this.hasAllDbParams()) {
            this.setupDbDetails(mongodb);
            this.testDbConnection();
        } else {
            logger.error(FILE_ID, 'Missing required DB params, aborting setup...');
        }
    }

    setupDbDetails(mongodb) {
        CONFIG.DB = Object.assign({}, CONFIG.DB, {
            CLIENT: mongodb.MongoClient,
            URL: `mongodb://${dbUser}:${dbPassword}@${dbAddress}`
        });

        console.log('CONFIG.DB', CONFIG.DB.URL)
    }

    hasAllDbParams() {
        return [
            dbAddress,
            dbUser,
            dbPassword
        ].filter(entry => entry === undefined).length === 0;
    }

    testDbConnection() {
        logger.log(FILE_ID, 'Attempting to establish connection with db ...');
        CONFIG.DB.CLIENT.connect(CONFIG.DB.URL, (error, db) => {
            if (error) {
                logger.error(FILE_ID, `Database connection error: ${error}`);
                return;
            }

            logger.info(FILE_ID, 'Connection with database established successfully.');
            db.close();
        });
    }
}