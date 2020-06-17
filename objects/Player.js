class Player {

    /**
     * Constructeur de l'objet Player.
     */
    constructor() {
        this.player = {};
    }

    /**
     * On met en forme l'objet player.
     * @param player
     */
    setPlayer(player)
    {
        this.player = player.playerInfo;
        this.player.accuracy = player.scoreStats.averageRankedAccuracy;
        this.player.leaderboardEntry = {
            playerid: this.player.playerId,
            name: this.player.playerName,
            pp: this.player.pp,
            country: this.player.country,
            discordUser: ""
        }
    }

    /**
     * Getter pour récupéré le joueur mis en forme.
     * @returns {{}}
     */
    getPlayer() {
        return this.player
    }
}

module.exports = Player;
