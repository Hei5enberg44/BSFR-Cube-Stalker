class ServerLeaderboard {
    constructor(opt) {
        this.clients = opt.clients;
    }

    async getLeaderboardServer(discordId) {
        let guild = this.clients.discord.getClient().guilds.resolve(discordId);

        let leadRedis = await (await this.clients.redis.quickRedis()).get("leaderboard:" + discordId);
        if(!leadRedis) return false;
        let leaderboardServer = JSON.parse(leadRedis);

        let leaderFiltered = [];
        for(let i in leaderboardServer) {
            if(leaderboardServer[i]) {
                let member = guild.members.resolve(leaderboardServer[i].discordUser);
                if(member) {
                    leaderFiltered.push(leaderboardServer[i]);
                }
            }
        }
        leaderboardServer = leaderFiltered;

        leaderboardServer.sort((a, b) => {
            if(a && b) {
                const ppA = a.pp;
                const ppB = b.pp;
                if (ppB > ppA) {
                    return 1;
                } else if (ppB < ppA) {
                    return -1;
                }
            }
        });

        await this.setLeaderboardServer(discordId, JSON.stringify(leaderboardServer));

        return leaderboardServer;
    }

    async setLeaderboardServer(discordId, lead) {
        return await (await this.clients.redis.quickRedis()).set("leaderboard:" + discordId, lead);
    }
}

module.exports = ServerLeaderboard;