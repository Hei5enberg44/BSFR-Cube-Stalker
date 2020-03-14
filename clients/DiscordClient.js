const Package = require("discord.js");

class DiscordClient {

    /**
     * Constructeur du DiscordClient
     * @param opt
     */
    constructor(opt) {
        this.config = opt.config;
        this.client = new Package.Client();
    }

    /**
     * Fonction de login pour discord.js
     */
    loginClient() {
        this.client.login(this.config.discord.token);
    }

    /**
     * Getter pour le client.
     * @returns {Client | module:"discord.js".Client}
     */
    getClient() {
        return this.client;
    }

}

module.exports = DiscordClient;