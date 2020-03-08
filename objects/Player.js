class Player {
    constructor() {
        this.player = {};
    }

    setPlayer(player)
    {
        this.player = player.playerInfo
        this.player.accuracy = player.scoreStats.averageRankedAccuracy
    }

    getPlayer() {
        return this.player
    }
}

module.exports = Player;