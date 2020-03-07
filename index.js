class CubeStalker {

    constructor() {
        let clients = {
            Discord: require("./clients/DiscordClient.js")
        };

        this.config = require("./config.json");
        this.discordClient = new clients.Discord(this);

        this.init()
    }

    init() {
        this.discordClient.loginClient();
        this.discordClient.getClient().on("ready", () => {
            console.log("DiscordClient: Ready.");
        });
    }

}

let Index = new CubeStalker();