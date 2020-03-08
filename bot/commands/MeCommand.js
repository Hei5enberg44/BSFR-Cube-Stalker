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
            Usage: this.config.discord.prefix + "me [<mention>]",
            Description: "Affiche votre profil ScoreSaber.",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {

        await this.clients.redis.loginRedis();
        const id = await this.clients.redis.getInstance().get(message.author.id);
        this.clients.redis.logoutRedis();

        if(id === null) {
            await message.channel.send("> :x:  Aucun profil n'est lié ! Utilisez la commande ``!profile [lien scoresaber]``.")
            return;
        }

        let player = await this.utils.ScoreSaber.getProfile(id);

        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            if(args.join().toLowerCase().indexOf("bien") > -1)
            {
                channel.send(":middle_finger:");
                return;
            }

            let embed = this.utils.Embed.embed();
            embed.setTitle(player.name)
                .setURL(this.config.scoresaber.url + "/u/" + id + ')')
                .setThumbnail(this.config.scoresaber.apiUrl + player.avatar)
                .addField("Rank", ":earth_africa: #" + player.rank + " | :flag_" + player.country.toLowerCase() + ": #" + player.countryRank)
                .addField("PP", "<:pepohype:686004175058108516> " + player.pp)
                .addField("Précision", ":dart: " + player.accuracy.toFixed(2) + "%")
                .setColor('#000000')

            channel.send(embed);
        })
    }

}

module.exports = MeCommand;