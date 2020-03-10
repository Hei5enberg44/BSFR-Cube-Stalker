const Discord = require("discord.js");
const util = require("util");

class MeCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "me",
            Usage: this.config.discord.prefix + "me [<utilisateur>]",
            Description: "Affiche votre profil ScoreSaber.",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {

        let discordSelected, discordMember;
        if(args[0]) {
            let promisifiedMember = util.promisify(this.utils.DiscordServer.getMember);
            let memberFound = await promisifiedMember(message.guild, args[0]);
            discordMember = memberFound;
            discordSelected = memberFound.user.id
        } else {
            discordSelected = message.author.id;
            discordMember = message.author
        }

        /*await this.clients.redis.loginRedis();
        const id = await this.clients.redis.getInstance().get(discordSelected);
        this.clients.redis.logoutRedis();*/
        const id = await (await this.clients.redis.quickRedis()).get(discordSelected);

        if(id === null) {
            if(args[0])
                await message.channel.send("> :x:  Aucun profil ScoreSaber n'est lié pour le compte Discord ``" + discordMember.user.tag + "``.");
            else
                await message.channel.send("> :x:  Aucun profil ScoreSaber n'est lié avec votre compte Discord!\nUtilisez la commande ``!profile [lien scoresaber]`` pour pouvoir en lier un.")
            return;
        }

        try {
            let res = await this.utils.ScoreSaber.refreshProfile(id);
            this.utils.Logger.log("Profil mis à jour: " + res);
        } catch(e) {
            await message.channel.send("> :x:  La mise à jour du profil n'a pas pu être réalisée, les données ci-dessous peuvent être inexactes.")
        }

        let player = await this.utils.ScoreSaber.getProfile(id, (discordSelected === message.author.id), message);
        let score = await this.utils.ScoreSaber.getTopScore(id);

        /*await this.clients.redis.loginRedis();
        const leaderboardServer = await this.clients.redis.getInstance().get("ld_" + message.guild.id);
        this.clients.redis.logoutRedis();*/

        const leaderboardServer = await (await this.clients.redis.quickRedis()).get("ld_" + message.guild.id);

        if(leaderboardServer) {
            console.log("pepega")
        } else {
            await message.channel.send("> :ok_hand:  Serait-ce un nouveau serveur? Je vous initialise le leaderboard.")

        }

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
                .addField("Rang", ":earth_africa: #" + player.rank + " | :flag_" + player.country.toLowerCase() + ": #" + player.countryRank)
                .addField("Points de Performance", ":clap: " + player.pp + "pp", true)
                .addField("Précision Classé", ":dart: " + player.accuracy.toFixed(2) + "%", true)
                .addField("Meilleur score", ":one: " + score.songAuthorName + " " + score.songSubName + " - " + score.name + " [" + score.diff + "] by " + score.levelAuthorName)
                .addField("Infos sur le meilleur score", ":mechanical_arm: Rank: " + score.rank + " | Score: " + score.score + " | PP: " + score.pp)
                .setColor('#000000');

            channel.send(embed);
        })
    }

}

module.exports = MeCommand;