class ServerLeaderboard {
    constructor(opt) {
        this.clients = opt.clients;
    }

    async getLeaderboardServer(discordId) {
        let leadRedis = await (await this.clients.redis.quickRedis()).get("leaderboard:" + discordId);
        if(!leadRedis) return false;
        let leaderboardServer = JSON.parse(leadRedis);

        leaderboardServer.sort((a, b) => {
            const ppA = a.pp;
            const ppB = b.pp;
            if (ppB > ppA) {
                return 1;
            } else if (ppB < ppA) {
                return -1;
            }
        });

        return leaderboardServer;
    }

    async setLeaderboardServer(discordId, lead) {
        return await (await this.clients.redis.quickRedis()).set("leaderboard:" + discordId, lead);
    }
}

module.exports = ServerLeaderboard;