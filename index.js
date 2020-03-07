class CubeStalker {

    constructor() {

        // Déclaration des clients

        let clients = {
            Discord: require("./clients/DiscordClient.js"),
            Redis: require("./clients/RedisClient.js")
        };

        // Déclaration des utils et de la configuration

        this.utils = {
            Logger: new (require("./utils/Logger.js"))
        };

        this.config = require("./config.json");

        // Instantiation des clients

        this.clients = {
            discord: new clients.Discord(this),
            redis: new clients.Redis(this)
        };

        // Initialisation du bot

        this.init()
    }

    init() {
        this.clients.discord.loginClient();
        this.clients.discord.getClient().on("ready", () => {
            this.utils.Logger.log("Discord: Ready.");
        });
    }

}

let Index = new CubeStalker();