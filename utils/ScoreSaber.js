const https = require('https');
const Player = require('../objects/Player.js');

class ScoreSaber {
    getProfile(id) {
        let player = new Player();

        https.get('https://new.scoresaber.com/api/player/' + id + '/full', function(response) {
            response.on('data', function(data) {
                data = JSON.parse(data)
                player.setPlayer(data.playerInfo.name, data.playerInfo.country, data.playerInfo.countryRank, data.playerInfo.rank, data.playerInfo.pp, data.scoreStats.averageRankedAccuracy)
            });
        }).on('error', function(e) {
            console.error(e);
        });

        return player.getPlayer();
    }
}

module.exports = ScoreSaber;