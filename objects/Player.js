class Player {
    constructor() {
        this.player = {};
    }

    setPlayer(player)
    {
        this.player = player.playerInfo;
        this.player.accuracy = player.scoreStats.averageRankedAccuracy;
        this.player.leaderboardEntry = {
            playerid: this.player.playerid,
            name: this.player.name,
            pp: this.player.pp,
            country: this.player.country
        }
    }

    getPlayer() {
        return this.player
    }
}

module.exports = Player;