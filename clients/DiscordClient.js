const Package = require("discord.js");

class DiscordClient {

    constructor(opt) {
        this.config = opt.config;
        this.client = new Package.Client();
    }

    loginClient() {
        this.client.login(this.config.token);
    }

    getClient() {
        return this.client;
    }

}

module.exports = DiscordClient;