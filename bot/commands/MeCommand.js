class MeCommand {

    /**
     * Constructeur de la commande
     * @param opt
     */
    constructor(opt) {
        this.clients = opt.clients;
        this.commands = opt.commands;
        this.utils = opt.utils;
        this.config = opt.config;
    }

    /**
     * Permet de récupérer la "metadata" de la commande.
     * @returns {{Usage: string, Description: string, Command: string, ShowInHelp: boolean, Run: (function(*=, *=): void), Aliases: [string, string]}}
     */
    get meta() {
        return {
            name: "me",
            description: "Affiche les informations d'un joueur.",
            options: {
                "player": {
                    "name": "joueur",
                    "type": "user",
                    "description": "Afficher les informations d'un autre joueur",
                    "required": false
                }
            }
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param interaction
     */
    async exec(interaction) {

        let user = interaction.user
        let member = interaction.member

        if(interaction.options._hoistedOptions.filter((args) => args.name === "joueur").length > 0) {
            user = interaction.options._hoistedOptions.filter((args) => args.name === "joueur")[0].user
            member = interaction.options._hoistedOptions.filter((args) => args.name === "joueur")[0].member
        }

        const id = await (await this.clients.redis.quickRedis()).get(user.id);

        // Si l'utilisateur n'a pas relié de profil, on exécute ce qui figure ci dessous.
        if(id === null) {
            if(interaction.user.id !== user.id)
                return await interaction.reply({ content: "> :x:  Aucun profil ScoreSaber n'est lié pour le compte Discord ``" + user.tag + "``.", ephemeral: true });
            else
                return await interaction.reply({ content: "> :x:  Aucun profil ScoreSaber n'est lié avec votre compte Discord!\nUtilisez la commande ``/profil [lien scoresaber]`` pour pouvoir en lier un.", ephemeral: true })
        }

        let apiStatus = await this.utils.ScoreSaber.checkApiIsUp();
        if (apiStatus === false)
            return await interaction.reply({ content: "> :x:  Il semblerait que ScoreSaber soit injoignable. Veuillez réessayer plus tard." })

        try {
            let res = await this.utils.ScoreSaber.refreshProfile(id);
            this.utils.Logger.log("Profil mis à jour: " + res);
        } catch(e) {
            return await interaction.reply({ content: "> :x:  La mise à jour du profil n'a pas pu être réalisée, les données ci-dessous peuvent être inexactes.", ephemeral: true })
        }

        let player = await this.utils.ScoreSaber.getProfile(id, member, id);
        let score = await this.utils.ScoreSaber.getTopScore(id);

        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(member.guild.id, true);

        if(!player || !score || !leaderboardServer)
            return await interaction.reply({ content: "> :x:  Le profil ScoreSaber n'a pas pu être récupéré.", ephemeral: true })

        let content

        if(leaderboardServer) {
            let foundInLead;
            let placement;
            for(let l in leaderboardServer) {
                if(leaderboardServer[l].playerid === player.playerId) {
                    foundInLead = leaderboardServer[l];
                    placement = l;
                    break;
                }
            }

            // Est-il présent dans le ld serveur?
            if(foundInLead) {
                // Oui.
                foundInLead.pp = player.pp;
                foundInLead.acc = player.accuracy;
                leaderboardServer[placement] = foundInLead;
                await this.utils.ServerLeaderboard.setLeaderboardServer(member.guild.id, JSON.stringify(leaderboardServer)); // Mise à jour du leaderboard avec le pp du profil.
            } else {
                // Non.

                // Si un autre utilisateur consulte le profil d'un autre qui n'a jamais run !me, on l'ajoute au Leaderboard.
                if(interaction.user.id !== user.id)
                    content = "> :clap:  ``" + player.playerName + "`` a été ajouté au classement du serveur."
                else
                    content = "> :clap:  Vous avez été ajouté au classement du serveur."
                player.leaderboardEntry.discordUser = user.id;
                leaderboardServer.push(player.leaderboardEntry);
                await this.utils.ServerLeaderboard.setLeaderboardServer(member.guild.id, JSON.stringify(leaderboardServer)); // Mise à jour du leaderboard.
            }
        } else {
            // On initialise le leaderboard du serveur avec le premier joueur.
            content = "> <:discord:686990677451604050>  Serait-ce un nouveau serveur? Je vous initialise le classement tout de suite."
            leaderboardServer = [];
            player.leaderboardEntry.discordUser = user.id;
            leaderboardServer.push(player.leaderboardEntry);
            await this.utils.ServerLeaderboard.setLeaderboardServer(member.guild.id, JSON.stringify(leaderboardServer)); // Mise à jour du leaderboard.
        }

        // On récupère le leaderboard Acc et PP du serveur.
        let leaderboardServerPp = await this.utils.ServerLeaderboard.getLeaderboardServer(member.guild.id, true);
        let leaderboardServerAcc = await this.utils.ServerLeaderboard.getLeaderboardServer(member.guild.id, false);

        // On récupère la position du joueur dans le leaderboard Pp serveur.
        let posInLeadPp = 1;
        for(let l in leaderboardServerPp) {
            if(leaderboardServerPp[l].playerid === player.playerId) {
                break;
            }
            posInLeadPp++;
        }

        // On récupère la position du joueur dans le leaderboard Acc serveur.
        let posInLeadAcc = 1;
        for(let l in leaderboardServerAcc) {
            if(leaderboardServerAcc[l].playerid === player.playerId) {
                break;
            }
            posInLeadAcc++;
        }

        // Petite médaille de l'amour
        if(posInLeadPp === 1) {
            posInLeadPp = ":first_place:"
        } else if(posInLeadPp === 2) {
            posInLeadPp = ":second_place:"
        } else if(posInLeadPp === 3) {
            posInLeadPp = ":third_place:"
        } else {
            posInLeadPp = "#" + posInLeadPp;
        }

        // Petite médaille de l'amour
        if(posInLeadAcc === 1) {
            posInLeadAcc = ":first_place:"
        } else if(posInLeadAcc === 2) {
            posInLeadAcc = ":second_place:"
        } else if(posInLeadAcc === 3) {
            posInLeadAcc = ":third_place:"
        } else {
            posInLeadAcc = "#" + posInLeadAcc;
        }

        let difficulty = score.difficultyRaw.split("_")[1].replace("Plus", "+");

        // On prépare l'embed.
        let embed = this.utils.Embed.embed();
        await embed.setTitle(player.playerName)
            .setURL(this.config.scoresaber.url + "/u/" + id)
            .setThumbnail(this.config.scoresaber.apiUrl + player.avatar + "?date=" + new Date().getTime())
            .addField("Rang", ":earth_africa: #" + player.rank + " | :flag_" + player.country.toLowerCase() + ": #" + player.countryRank)
            .addField("Rang Discord", "**PP**: " + posInLeadPp + " / " + leaderboardServerPp.length + " joueurs" + "\n**Précision**: " + posInLeadAcc + " / " + leaderboardServerAcc.length + " joueurs")
            .addField("Points de performance", ":clap: " + player.pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp", true)
            .addField("Précision en classé", ":dart: " + player.accuracy.toFixed(2) + "%", true)
            .addField("Meilleur score", ":one: " + score.songAuthorName + " " + score.songSubName + " - " + score.songName + " [" + difficulty + "] by " + score.levelAuthorName)
            .addField("Infos sur le meilleur score", ":mechanical_arm: Rank: " + score.rank + " | Score: " + score.score + " | PP: " + score.pp)
            .setColor('#000000');

        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await interaction.reply({ content, embeds: [embed] });

    }

}

module.exports = MeCommand;