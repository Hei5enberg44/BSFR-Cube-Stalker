const CronJob = require('cron').CronJob;

class CubeStalker {

    constructor() {

        // Déclaration de la configuration

        this.config = require("./config.json");

        // Déclaration des clients

        let clients = {
            Discord: require("./clients/DiscordClient.js"),
            Redis: require("./clients/RedisClient.js"),
            ScoreSaber: require("./clients/ScoreSaberClient.js"),
            BeatSaver: require("./clients/BeatSaverClient.js")
        };

        // Instanciation des clients

        this.clients = {
            discord: new clients.Discord(this),
            redis: new clients.Redis(this),
            beatsaver: new clients.BeatSaver(this),
            raw: {
                redis: clients.Redis
            }
        };

        this.clients.scoresaber = new clients.ScoreSaber(this)

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

        // Instanciation des serveurs

        let servers = {
            BSDFeed: require("./server/BSDFeed.js")
        }

        this.servers = {
            BSDFeed: new servers.BSDFeed(this)
        }

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
        });

        // Initialisation du serveur feed BSD
        this.servers.BSDFeed.init();

        this.clients.scoresaber.login();
    }
}

let Index = new CubeStalker();
