class ServerLeaderboard {

    /**
     * Constructeur de ServerLeaderboard.
     * @param opt
     */
    constructor(opt) {
        this.clients = opt.clients;
    }

    /**
     * Fonction permettant la récupération du leaderboard auprès de Redis.
     * @param discordId
     * @returns {Promise<boolean|[]>}
     */
    async getLeaderboardServer(discordId) {

        // On récupère l'objet guilde.
        let guild = this.clients.discord.getClient().guilds.resolve(discordId);

        // On récupère le leaderboard en JSON.
        let leadRedis = await (await this.clients.redis.quickRedis()).get("leaderboard:" + discordId);
        if(!leadRedis) return false;
        let leaderboardServer = JSON.parse(leadRedis);

        // On filtre le leaderboard au cas où des personnes ont quitté le Discord.
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

        // On classe le leaderboard en fonction du pp.
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

        // On met à jour le leaderboard.
        await this.setLeaderboardServer(discordId, JSON.stringify(leaderboardServer));

        // On retourne le leaderboard serveur.
        return leaderboardServer;
    }

    /**
     * Fonction mettant à jour le leaderboard serveur.
     * @param discordId
     * @param lead
     * @returns {Promise<*>}
     */
    async setLeaderboardServer(discordId, lead) {
        return await (await this.clients.redis.quickRedis()).set("leaderboard:" + discordId, lead);
    }
}

module.exports = ServerLeaderboard;
