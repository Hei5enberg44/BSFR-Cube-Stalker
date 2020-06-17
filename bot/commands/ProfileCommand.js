const util = require("util");

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
    getCommand() {
        return {
            Command: "profile",
            Aliases: ["profilelink", "link"],
            Usage: "<link> (<utilisateur>)",
            Description: "Lie votre compte ScoreSaber à votre compte Discord.",
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

        // On récupère l'objet membre.
        let member = message.guild.members.resolve(message.author.id);

        let discordSelected, discordMember;

        // Le deuxième argument ne peut être pris en compte que si l'utilisateur possède un rôle "admin" ou "Admin".
        if(args[1] && member.roles.cache.some(r=>["admin", "Admin"].includes(r.name))) {
            // On regarde quel utilisateur a été choisi.
            let promisifiedMember = util.promisify(this.utils.DiscordServer.getMember);
            let memberFound = await promisifiedMember(message.guild, args[1]);
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

        // Un argument au moins est nécessaire.
        if(!args[0]) {
            await message.channel.send("> :x:  Veuillez indiquer un profil ScoreSaber.");
            return;
        }

        // On prépare le parsing de l'URL.
        let url = "http";

        // HTTPS?
        if(args[0].indexOf("https") > -1) {
            url = "https"
        }

        // On complète l'url.
        url += "://scoresaber.com/u/";

        // On vérifie si l'URL est valide.
        if(!(args[0].indexOf(url) > -1)) {
            await message.channel.send("> :x:  Veuillez indiquer un profil ScoreSaber valide.");
            return;
        }

        // On récupère l'ID du profil ScoreSaber.
        let profileId = args[0].replace(url , "");
        
        profileId = profileId.split("?")[0];
        profileId = profileId.split("&")[0];

        // On récupère le leaderboard serveur.
        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        // On vérifie que le profil n'est pas déjà présent dans le leaderboard du serveur.
        let foundProfile = false;
        for(let i in leaderboardServer) {
            if(parseInt(leaderboardServer[i].playerid) === parseInt(profileId)) {
                foundProfile = true;
                break;
            }
        }
        if(foundProfile) {
            await message.channel.send("> :x:  Ce profil ScoreSaber est déjà relié à un compte Discord.");
            return;
        }

        // On fait en sorte de supprimer l'ancien profil de l'utilisateur Discord pour éviter les doublons.
        let leadFiltered = [];
        for(let i in leaderboardServer) {
            if(leaderboardServer[i].discordUser !== discordSelected) {
                leadFiltered.push(leaderboardServer[i]);
            }
        }
        // On met à jour le leaderboard.
        await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leadFiltered));

        // On met également à jour la clé Redis de l'utilisateur.
        await (await this.clients.redis.quickRedis()).set(discordSelected, profileId);

        // On récupère le profil enregistré et on envoie un message de confirmation.
	try {
        	let player = await this.utils.ScoreSaber.getProfile(profileId, message, discordSelected);
        	if(message.author.id === discordSelected)
            		await message.channel.send("> :white_check_mark:  Le profil ScoreSaber ``" + player.playerName + "`` a bien été lié avec votre compte Discord.\nAstuce: Tapez la commande ``" + this.config.discord.prefix + "me`` pour pouvoir être ajouté au classement du serveur.");
        	else
           		await message.channel.send("> :white_check_mark:  Le profil ScoreSaber ``" + player.playerName + "`` a bien été lié avec le compte Discord ``" + discordMember.user.tag + "``.");
	} catch (error) {
		await message.channel.send("> :x: Le profil ne semble pas encore prêt. Merci de réessayer plus tard")
		this.utils.Logger.log("Profil indisponible: " + profileId)
	}
    }

}

module.exports = ProfileCommand;
