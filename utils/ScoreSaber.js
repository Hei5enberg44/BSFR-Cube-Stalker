const axios = require('axios');
const Player = require('../objects/Player.js');

class ScoreSaber {
    constructor(opt) {
        this.config = opt.config;
    }

    async refreshProfile(id) {
        return (await axios.get(this.config.scoresaber.apiUrl + '/api/manage/user/' + id + '/refresh')).data.updated
    }

    async getProfile(id) {
        let player = new Player();
        let response = await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/full')
        player.setPlayer(response.data)
        return player.getPlayer();
    }

    async getTopScore(id) {
        let score = (await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/scores/top')).data.scores[0]
        score.diff = score.diff.split("_")[1];

        return score
    }

    async getLeaderboard() {
        return (await axios.get(this.config.scoresaber.apiUrl + '/api/players/1')).data
    }
}

module.exports = ScoreSaber;