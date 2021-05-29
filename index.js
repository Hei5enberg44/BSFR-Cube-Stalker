const CronJob = require('cron').CronJob;

class CubeStalker {

    constructor() {

        // Déclaration de la configuration

        this.config = require("./config.json");

        // Déclaration des clients

        let clients = {
            Discord: require("./clients/DiscordClient.js"),
            Redis: require("./clients/RedisClient.js"),
            ScoreSaber: require("./clients/ScoreSaberClient.js")
        };

        // Instanciation des clients

        this.clients = {
            discord: new clients.Discord(this),
            redis: new clients.Redis(this),
            scoresaber: new clients.ScoreSaber(this),
            raw: {
                redis: clients.Redis
            }
        };

        // Déclaration des utils

        this.utils = {
            Logger: new (require("./utils/Logger.js")),
            Embed: new (require("./utils/Embed.js")),
            ServerLeaderboard: new (require("./utils/ServerLeaderboard.js"))({clients: this.clients}),
            DiscordServer: new (require("./utils/DiscordServer.js"))({clients: this.clients})
        };

        this.utils.ScoreSaber = new (require("./utils/ScoreSaber.js"))({config: this.config, clients: this.clients, utils: this.utils });

        // Instanciation et initialisation des Managers

        let managers = {
            Commands: require("./bot/CommandManager.js")
        };

        this.managers = {
            commands: new managers.Commands(this)
        };

        // Initialisation du bot

        this.init()
    }

    async init() {

        // On fait login le bot à la gateway de Discord.
        this.clients.discord.loginClient();

        this.clients.discord.getClient().on("ready", async () => {
            this.utils.Logger.log("Discord: Ready.");

            // On change l'activité du bot.
            await this.clients.discord.getClient().user.setActivity(this.config.discord.prefix + 'help - By Krixs & JiveOff', {
                type: "LISTENING"
            });

            // On démarre le CommandManager.
            this.managers.commands.init();

            // On démarre le cron job.
            this.utils.Logger.log("CronJob: Ready.");
            new CronJob('0 0 * * *', async () => {
                this.utils.Logger.log("CronJob: Refreshing.");

                let newLd = await this.utils.ScoreSaber.refreshGuild("531101359471329291");
                let oldLd = await this.utils.ServerLeaderboard.getLeaderboardServer("531101359471329291", true)
                let ld = []

                await this.utils.ScoreSaber.asyncForEach(oldLd, async (oldPlayer) => {
                    await this.utils.ScoreSaber.asyncForEach(newLd, async (newPlayer) => {
                        if(oldPlayer.playerid === newPlayer.playerid) {
                            newPlayer.discordUser = oldPlayer.discordUser;
                            ld.push(newPlayer);
                        }
                    })
                })

                await this.utils.ServerLeaderboard.setLeaderboardServer("531101359471329291", JSON.stringify(ld)); // Mise à jour du leaderboard.
            }, null, true, 'Europe/London');

            console.log(await (await this.clients.scoresaber.login()).getLeaderboard("499E94F2FFB162DBA02D4E499163A9CDE3B925E5", "Normal"))
        });
    }

}

let Index = new CubeStalker();
