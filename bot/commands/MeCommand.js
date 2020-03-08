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

        this.utils.Logger.log("Profil mis à jour: " + await this.utils.ScoreSaber.refreshProfile(id));
        let player = await this.utils.ScoreSaber.getProfile(id);
        let score = await this.utils.ScoreSaber.getTopScore(id);

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
                .addField("PP", ":clap: " + player.pp)
                .addField("Précision", ":dart: " + player.accuracy.toFixed(2) + "%")
                .addField("Best Run", ":one: " + score.songAuthorName + " " + score.songSubName + " - " + score.name + " [" + score.diff + "] by " + score.levelAuthorName)
                .addField("Best Run Infos", ":mechanical_arm: Rank: " + score.rank + " | Score: " + score.score + " | PP: " + score.pp)
                .setColor('#000000')

            channel.send(embed);
        })
    }

}

module.exports = MeCommand;