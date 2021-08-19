const { Client, Intents } = require("discord.js");

class DiscordClient {

    /**
     * Constructeur du DiscordClient
     * @param opt
     */
    constructor(opt) {
        this.config = opt.config;
        this.client = new Client({
            intents: [
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILDS
            ],
            partials: [
                "CHANNEL"
            ]
        });
    }

    /**
     * Fonction de login pour discord.js
     */
    loginClient() {
        this.client.login(this.config.discord.token);
    }

    /**
     * Getter pour le client.
     */
    getClient() {
        return this.client;
    }

}

module.exports = DiscordClient;