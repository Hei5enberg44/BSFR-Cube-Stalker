class CubeStalker {

    constructor() {

        // Déclaration des clients

        let clients = {
            Discord: require("./clients/DiscordClient.js"),
            Redis: require("./clients/RedisClient.js")
        };

        // Déclaration des utils et de la configuration

        this.utils = {
            Logger: new (require("./utils/Logger.js")),
            Embed: new (require("./utils/Embed.js")),
            ScoreSaber: new (require("./utils/ScoreSaber.js"))
        };

        this.config = require("./config.json");

        // Instanciation des clients

        this.clients = {
            discord: new clients.Discord(this),
            redis: new clients.Redis(this)
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

    init() {
        this.clients.discord.loginClient();
        this.clients.redis.loginRedis();
        this.clients.discord.getClient().on("ready", async () => {
            this.utils.Logger.log("Discord: Ready.");

            const value = await this.clients.redis.getInstance().get("186156892379283456");
            console.log(value);

            this.managers.commands.init();
        });
    }

}

let Index = new CubeStalker();