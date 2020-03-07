class Player {
    constructor() {
        this.player = {};
    }

    setPlayer(name, country, countryRank, rank, pp, accuracy)
    {
        this.player = {
            "name": name,
            "country": country,
            "countryRank": countryRank,
            "rank": rank,
            "pp": pp,
            "accuracy": accuracy
        }
    }

    getPlayer() {
        return this.player
    }
}

module.exports = Player;