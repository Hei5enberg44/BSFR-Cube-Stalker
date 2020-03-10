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
            Aliases: ["doisuck", "plspp"],
            Usage: "[<utilisateur>]",
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

        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        if(leaderboardServer) {
            let foundInLead;
            for(let l in leaderboardServer) {
                if(leaderboardServer[l].playerid === player.playerid) {
                    foundInLead = leaderboardServer[l];
                    break;
                }
            }
            if(!foundInLead) {
                if(args[0])
                    await message.channel.send("> :clap:  ``" + player.name + "`` a été ajouté au classement du serveur.");
                else
                    await message.channel.send("> :clap:  Vous avez été ajouté au classement du serveur.");
                leaderboardServer.push(player.leaderboardEntry);
                await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leaderboardServer));
            }
        } else {
            await message.channel.send("> <:discord:686990677451604050>  Serait-ce un nouveau serveur? Je vous initialise le classement tout de suite.");
            leaderboardServer = [];
            leaderboardServer.push(player.leaderboardEntry);
            await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leaderboardServer));
        }

        leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        let posInLead = 1;
        for(let l in leaderboardServer) {
            if(leaderboardServer[l].playerid === player.playerid) {
                break;
            }
            posInLead++;
        }
        if(posInLead === 1) {
            posInLead = ":first_place:"
        } else if(posInLead === 2) {
            posInLead = ":second_place:"
        } else if(posInLead === 3) {
            posInLead = ":third_place:"
        } else {
            posInLead = "#" + posInLead;
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
                .addField("Rang", ":earth_africa: #" + player.rank + " | :flag_" + player.country.toLowerCase() + ": #" + player.countryRank + "\n\n<:discord:686990677451604050> " + posInLead + " (sur " + leaderboardServer.length + " joueurs)")
                .addField("Points de performance", ":clap: " + player.pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp", true)
                .addField("Précision en classé", ":dart: " + player.accuracy.toFixed(2) + "%", true)
                .addField("Meilleur score", ":one: " + score.songAuthorName + " " + score.songSubName + " - " + score.name + " [" + score.diff + "] by " + score.levelAuthorName)
                .addField("Infos sur le meilleur score", ":mechanical_arm: Rank: " + score.rank + " | Score: " + score.score + " | PP: " + score.pp)
                .setColor('#000000');

            channel.send(embed);
        })
    }

}

module.exports = MeCommand;