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
            Command: "unlink",
            Aliases: ["profileunlink"],
            Usage: "<utilisateur>",
            Description: "Delink le profil.",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: false
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

        // On vérifie si l'utilisateur est un admin, sinon pepelaugh :^)
        let isAdmin = member.roles.cache.some(r=>["admin", "Admin"].includes(r.name));
        if(!isAdmin) {
            await message.react(this.config.emoji_perm);
            return;
        }

        let discordSelected, discordMember;
        if(args[0] && member.roles.cache.some(r=>["admin", "Admin"].includes(r.name))) {
            // On regarde quel utilisateur a été choisi.
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
            // Aucune autre argument mentionné.
            await message.channel.send("> :x:  Veuillez indiquer un utilisateur.");
            return;
        }

        // On récupère le leaderboard serveur.
        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id, true);

        // On fait en sorte de filtrer le leaderboard de l'utilisateur qui vient d'être unlink.
        let leadFiltered = [];
        for(let i in leaderboardServer) {
            if(leaderboardServer[i].discordUser !== discordSelected) {
                leadFiltered.push(leaderboardServer[i]);
            }
        }
        // On met à jour le leaderboard.
        await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leadFiltered));

        // On supprime la clé Redis contenant l'ID ScoreSaber.
        await (await this.clients.redis.quickRedis()).del(discordSelected);

        // On renvoie une confirmation.
        await message.channel.send("> :white_check_mark:  Compte Discord unlink: ``" + discordMember.user.tag + "``.");

    }

}

module.exports = ProfileCommand;