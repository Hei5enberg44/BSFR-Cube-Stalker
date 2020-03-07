const axios = require('axios');
const Player = require('../objects/Player.js');

class ScoreSaber {
    async getProfile(id) {
        let player = new Player();

        let response = await axios.get('https://new.scoresaber.com/api/player/' + id + '/full')
        player.setPlayer(response.data.playerInfo.name, response.data.playerInfo.country, response.data.playerInfo.countryRank, response.data.playerInfo.rank, response.data.playerInfo.pp, response.data.scoreStats.averageRankedAccuracy)
        return player.getPlayer();
    }
}

module.exports = ScoreSaber;