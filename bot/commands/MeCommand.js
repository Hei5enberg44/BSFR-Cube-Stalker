const util = require("util");

class MeCommand {

    /**
     * Constructeur de la commande
     * @param opt
     */
    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    /**
     * Permet de récupérer la "metadata" de la commande.
     * @returns {{Usage: string, Description: string, Command: string, ShowInHelp: boolean, Run: (function(*=, *=): void), Aliases: [string, string]}}
     */
    getCommand() {
        return {
            Command: "me",
            Aliases: ["doisuck", "plspp"],
            Usage: "[<utilisateur>]",
            Description: "Affiche votre profil ScoreSaber.",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: true
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param args
     * @param message
     */
    async exec(args, message) {

        // On regarde quel utilisateur a été choisi.
        let discordSelected, discordMember;
        if(args[0]) {
            let promisifiedMember = util.promisify(this.utils.DiscordServer.getMember);
            let memberFound = await promisifiedMember(message.guild, args[0]);
            if(!memberFound) {
                await message.channel.send("> :x:  Aucun utilisateur trouvé.");
                return;
            }
            // L'utilisateur ayant été trouvé, on modifie les valeurs de "target".
            discordMember = memberFound;
            discordSelected = memberFound.user.id
        } else {
            // Aucune autre argument mentionné, donc la "target" est la personne ayant exécuté la commande.
            discordSelected = message.author.id;
            discordMember = message.author
        }

        // On regarde si l'utilisateur "target" a lié son compte Discord à un profil ScoreSaber.
        const id = await (await this.clients.redis.quickRedis()).get(discordSelected);

        // Si l'utilisateur n'a pas relié de profil, on exécute ce qui figure ci dessous.
        if(id === null) {
            // Si quelqu'un d'autre à fait la commande pour quelqu'un d'autre.
            if(args[0])
                await message.channel.send("> :x:  Aucun profil ScoreSaber n'est lié pour le compte Discord ``" + discordMember.user.tag + "``.");
            else
                await message.channel.send("> :x:  Aucun profil ScoreSaber n'est lié avec votre compte Discord!\nUtilisez la commande ``" + this.config.discord.prefix + "profil [lien scoresaber]`` pour pouvoir en lier un.")
            return;
        }

	// On vérifie que l'api est joignable
	let apiStatus = await this.utils.ScoreSaber.checkApiIsUp();
	if (apiStatus == false) {
	    await message.channel.send("> :x:  Il semblerait que ScoreSaber soit injoignables. Veuillez réessayer plus tard.")
	    return;
	}

        // On se met dans un scope try catch au cas où le refresh ScoreSaber du profil n'a pas pu être réalisé.
        // A monitorer (issue gitlab)
        try {
            let res = await this.utils.ScoreSaber.refreshProfile(id);
            this.utils.Logger.log("Profil mis à jour: " + res);
        } catch(e) {
            await message.channel.send("> :x:  La mise à jour du profil n'a pas pu être réalisée, les données ci-dessous peuvent être inexactes.")
        }

        // On récupère le profil ScoreSaber de l'utilisateur visé ainsi que son meilleur score.
        let player = await this.utils.ScoreSaber.getProfile(id, message, discordSelected);
        let score = await this.utils.ScoreSaber.getTopScore(id);

        // On récupère le leaderboard serveur.
        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        if(!player || !score || !leaderboardServer) {
            await message.channel.send("> :x:  Le profil ScoreSaber n'a pas pu être récupéré.");
            return;
        }

        // Si le leaderboard serveur existe.
        if(leaderboardServer) {
            let foundInLead;
            for(let l in leaderboardServer) {
                if(leaderboardServer[l].playerid === player.playerId) {
                    foundInLead = leaderboardServer[l];
                    break;
                }
            }

            // Est-il présent dans le ld serveur?
            if(foundInLead) {
                // Oui.
                foundInLead.pp = player.pp;
                if(!args[0]) foundInLead.global = player.rank;
                await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leaderboardServer)); // Mise à jour du leaderboard avec le pp du profil.
            } else {
                // Non.

                // Si un autre utilisateur consulte le profil d'un autre qui n'a jamais run !me, on l'ajoute au Leaderboard.
                if(args[0])
                    await message.channel.send("> :clap:  ``" + player.playerName + "`` a été ajouté au classement du serveur.");
                else
                    await message.channel.send("> :clap:  Vous avez été ajouté au classement du serveur.");
                player.leaderboardEntry.discordUser = discordSelected;
                leaderboardServer.push(player.leaderboardEntry);
                await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leaderboardServer)); // Mise à jour du leaderboard.
            }
        } else {
            // On initialise le leaderboard du serveur avec le premier joueur.
            await message.channel.send("> <:discord:686990677451604050>  Serait-ce un nouveau serveur? Je vous initialise le classement tout de suite.");
            leaderboardServer = [];
            player.leaderboardEntry.discordUser = discordSelected;
            leaderboardServer.push(player.leaderboardEntry);
            await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leaderboardServer)); // Mise à jour du leaderboard.
        }

        // On récupère le leaderboard du serveur.
        leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        // On récupère la position du joueur dans le leaderboard serveur.
        let posInLead = 1;
        for(let l in leaderboardServer) {
            if(leaderboardServer[l].playerid === player.playerId) {
                break;
            }
            posInLead++;
        }

        // Petite médaille de l'amour
        if(posInLead === 1) {
            posInLead = ":first_place:"
        } else if(posInLead === 2) {
            posInLead = ":second_place:"
        } else if(posInLead === 3) {
            posInLead = ":third_place:"
        } else {
            posInLead = "#" + posInLead;
        }

        // Les blagues du genre "mention bien" :^)
        if(args.join().toLowerCase().indexOf("bien") > -1) {
            await message.channel.send(":middle_finger:");
            return;
        }

	// Récupération diff

        let difficulty = score.difficultyRaw.split("_")[1].replace("Plus", "+");

        // On prépare l'embed.
        let embed = this.utils.Embed.embed();
        embed.setTitle(player.playerName)
            .setURL(this.config.scoresaber.url + "/u/" + id)
            .setThumbnail(this.config.scoresaber.apiUrl + player.avatar + "?date=" + new Date().getTime())
            .addField("Rang", ":earth_africa: #" + player.rank + " | :flag_" + player.country.toLowerCase() + ": #" + player.countryRank + "\n\n<:discord:686990677451604050> " + posInLead + " (sur " + leaderboardServer.length + " joueurs)")
            .addField("Points de performance", ":clap: " + player.pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp", true)
            .addField("Précision en classé", ":dart: " + player.accuracy.toFixed(2) + "%", true)
            .addField("Meilleur score", ":one: " + score.songAuthorName + " " + score.songSubName + " - " + score.songName + " [" + difficulty + "] by " + score.levelAuthorName)
            .addField("Infos sur le meilleur score", ":mechanical_arm: Rank: " + score.rank + " | Score: " + score.score + " | PP: " + score.pp)
            .setColor('#000000');

        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await message.channel.send(embed);
    }

}

module.exports = MeCommand;
