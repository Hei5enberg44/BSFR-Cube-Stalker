const Discord = require("discord.js");

class MeCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "me",
            Usage: "!me [<username>]",
            Description: "Affiche votre profil ScoreSaber.",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {
        await this.clients.redis.loginRedis();
<<<<<<< HEAD
        const value = await this.clients.redis.getInstance().get(message.author.id);
=======
        const id = await this.clients.redis.getInstance().get("186156892379283456");
>>>>>>> krixs
        this.clients.redis.logoutRedis();

        let player = await this.utils.ScoreSaber.getProfile(id);

        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            let embed = this.utils.Embed.embed();
            let test = new Discord.MessageEmbed().setTitle(player.name)
                .setURL(this.config.scoresaber.url + "/u/" + id + ')')
                .setThumbnail(this.config.scoresaber.apiUrl + player.avatar)
                .addField("Rank", ":earth_africa: #" + player.rank + " | :flag_" + player.country.toLowerCase() + ": #" + player.countryRank)
                .addField("PP", "<:pepohype:686004175058108516> " + player.pp)
                .addField("Précision", ":dart: " + player.accuracy.toFixed(2) + "%")
                .setColor('#000000')

            channel.send(test);
        })
    }

}

module.exports = MeCommand;