const FILE_ID = 'api/resources/logout';
const logger = require('../../../logger');
const responder = require('../../common/responder');
const dbFind = require('../../../db/operations/find');
const CONFIG = require('../../../config');

function getAgeGroup(value, agegroups) {
    if (!agegroups || !!!agegroups.length) {
        return '';
    }

    return agegroups.find(group => group._id === value).abbreviation;
}

function getLeague(value, leagues) {
    if (!leagues || !!!leagues.length) {
        return '';
    }

    return leagues.find(group => group._id === value).abbreviation;
}

function getManagers(values, accounts) {
    if (!accounts || !!!accounts.length) {
        return '';
    }

    const manager = accounts.find(group => group._id === values[0]);
    const manager2 = accounts.find(group => group._id === values[1]);

    let result = manager ? `${manager.firstname} ${manager.surname}` : '';

    if (manager2) {
        result += `, ${manager2.firstname} ${manager2.surname}`;
    }

    return result;
}

function onTeamsRetrieve(error, teams, response) {
    if (error) {
      logger.error(FILE_ID, `Error while retrieving teams: ${error}`);
      responder.rejectBadGateway(response);
      return;
    };

    dbFind('accounts', null, (error, accounts) => {
        if (error) {
            logger.error(FILE_ID, `Error while retrieving accounts: ${error}`);
            responder.rejectBadGateway(response);
            return;
        };

        dbFind('leagues', null, (error, leagues) => {
            if (error) {
                logger.error(FILE_ID, `Error while retrieving leagues: ${error}`);
                responder.rejectBadGateway(response);
                return;
            };

            dbFind('agegroups', null, (error, agegroups) => {
                if (error) {
                    logger.error(FILE_ID, `Error while retrieving agegroups: ${error}`);
                    responder.rejectBadGateway(response);
                    return;
                };

                const dataToReturn = teams.map(team => {
                    return Object.assign({}, team, {
                        agegroup: getAgeGroup(team.agegroup, agegroups),
                        league: getLeague(team.league, leagues),
                        managers: getManagers([team.manager, team.manager2], accounts)
                    });
                });

                dataToReturn.forEach(team => {
                    delete team.manager;
                    delete team.manager2;
                });

                responder.send(response, {
                    status: CONFIG.CONSTANTS.HTTP_CODE.OK,
                    data: {
                        teams: dataToReturn
                    }
                });
            });
        });
    });
}

function retrieveTeams(request, response) {
    dbFind('teams', null, (error, result) => {
        onTeamsRetrieve(error, result, response);
    });
}

module.exports = new class TeamsPublicResource {

    get(request, response) {
        retrieveTeams(request, response);
    }
};
