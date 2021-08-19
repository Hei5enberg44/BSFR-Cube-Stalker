class ProfileCommand {

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
    get meta() {
        return {
            name: "setprofile",
            description: "Lie un compte ScoreSaber à un compte Discord.",
            options: {
                "link": {
                    "name": "lien_scoresaber",
                    "type": "string",
                    "description": "Lien du profil ScoreSaber",
                    "required": true
                },
                "player": {
                    "name": "joueur",
                    "type": "user",
                    "description": "Utilisateur",
                    "required": true
                }
            },
            roles: [ "Admin", "Modérateur" ]
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param interaction
     */
    async exec(interaction) {

        // On récupère l'objet membre.
        let member = interaction.member;
        let link = interaction.options._hoistedOptions.filter((args) => args.name === "lien_scoresaber")[0].value

        if(interaction.options._hoistedOptions.filter((args) => args.name === "joueur").length > 0)
            member = interaction.options._hoistedOptions.filter((args) => args.name === "joueur")[0].member

        // Le deuxième argument ne peut être pris en compte que si l'utilisateur possède un rôle "admin" ou "Admin".
        if(member.user.id !== interaction.user.id && !interaction.member.roles.cache.some(r=>["admin", "Admin", "modérateur", "Modérateur"].includes(r.name)))
            return await interaction.reply({ content: "> :x:  Vous n'êtes pas autorisé à utiliser des arguments **STAFF**.", ephemeral: true });

        // On prépare le parsing de l'URL.
        let url = "http";
        let newUrl = "http";

        // HTTPS?
        if(link.indexOf("https") > -1) {
            url = newUrl = "https"
        }

        // On complète l'url.
        url += "://scoresaber.com/u/";
        newUrl += "://new.scoresaber.com/u/";

        // On vérifie si l'URL est valide.
        if(!(link.indexOf(url) > -1) && !(link.indexOf(newUrl) > -1))
            return await interaction.reply({ content: "> :x:  Veuillez indiquer un profil ScoreSaber valide.", ephemeral: true });

        // On récupère l'ID du profil ScoreSaber.
        let profileId = link.replace(url , "").replace(newUrl, "");

        profileId = profileId.split("?")[0];
        profileId = profileId.split("&")[0];

        // On récupère le leaderboard serveur.
        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(this.config.discord.guildId, true);

        // On vérifie que le profil n'est pas déjà présent dans le leaderboard du serveur.
        let foundProfile = false;
        for(let i in leaderboardServer) {
            if(parseInt(leaderboardServer[i].playerid) === parseInt(profileId)) {
                foundProfile = true;
                break;
            }
        }

        if(foundProfile)
            return await interaction.reply({ content: "> :x:  Ce profil ScoreSaber est déjà relié à un compte Discord.", ephemeral: true });


        // On fait en sorte de supprimer l'ancien profil de l'utilisateur Discord pour éviter les doublons.
        let leadFiltered = [];
        for(let i in leaderboardServer) {
            if(leaderboardServer[i].discordUser !== member.user.id) {
                leadFiltered.push(leaderboardServer[i]);
            }
        }

        // On met à jour le leaderboard.
        await this.utils.ServerLeaderboard.setLeaderboardServer(this.config.discord.guildId, JSON.stringify(leadFiltered));

        // On met également à jour la clé Redis de l'utilisateur.
        await (await this.clients.redis.quickRedis()).set(member.user.id, profileId);

        // On récupère le profil enregistré et on envoie un message de confirmation.
        try {
                let player = await this.utils.ScoreSaber.getProfile(profileId, member, member.user.id);
                if(member.user.id === interaction.user.id)
                    await interaction.reply({ content: "> :white_check_mark:  Le profil ScoreSaber ``" + player.playerName + "`` a bien été lié avec votre compte Discord.\nAstuce: Tapez la commande ``/me`` pour pouvoir être ajouté au classement du serveur." });
                else
                    await interaction.reply({ content: "> :white_check_mark:  Le profil ScoreSaber ``" + player.playerName + "`` a bien été lié avec le compte Discord ``" + member.user.tag + "``." });
        } catch (error) {
            await interaction.reply({ content: "> :x: Le profil ne semble pas encore prêt. Merci de réessayer plus tard.", ephemeral: true})
            this.utils.Logger.log("[ProfileCommand] Profil indisponible: " + profileId)
        }
    }

}

module.exports = ProfileCommand;
