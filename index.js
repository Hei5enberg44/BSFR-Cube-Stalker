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
            redis: new clients.Redis(this)
        };

        // Déclaration des utils

        this.utils = {
            Logger: new (require("./utils/Logger.js")),
            Embed: new (require("./utils/Embed.js")),
            ScoreSaber: new (require("./utils/ScoreSaber.js"))({config: this.config}),
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
        this.clients.discord.loginClient();
        await this.clients.redis.loginRedis();
        this.clients.discord.getClient().on("ready", async () => {
            this.utils.Logger.log("Discord: Ready.");

            const value = await this.clients.redis.getInstance().get("186156892379283456");
            await this.clients.discord.getClient().user.setActivity(this.config.discord.prefix + 'help - By Krixs & JiveOff', {
                type: "LISTENING"
            });
            this.managers.commands.init();
        });
    }

}

let Index = new CubeStalker();