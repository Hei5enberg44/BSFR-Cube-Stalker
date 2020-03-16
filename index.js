const CronJob = require('cron').CronJob;

class CubeStalker {

    constructor() {

        // Déclaration de la configuration

        this.config = require("./config.json");

        // Déclaration des clients

        let clients = {
            Discord: require("./clients/DiscordClient.js"),
            Redis: require("./clients/RedisClient.js")
        };

        // Instanciation des clients

        this.clients = {
            discord: new clients.Discord(this),
            redis: new clients.Redis(this),
            raw: {
                redis: clients.Redis
            }
        };

        // Déclaration des utils

        this.utils = {
            Logger: new (require("./utils/Logger.js")),
            Embed: new (require("./utils/Embed.js")),
            ScoreSaber: new (require("./utils/ScoreSaber.js"))({config: this.config, clients: this.clients}),
            ServerLeaderboard: new (require("./utils/ServerLeaderboard.js"))({clients: this.clients}),
            DiscordServer: new (require("./utils/DiscordServer.js"))({clients: this.clients})
        };

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
                await this.utils.ScoreSaber.refreshGuild("531101359471329291");
            }, null, true, 'Europe/London');
        });
    }

}

let Index = new CubeStalker();