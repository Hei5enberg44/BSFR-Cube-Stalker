const Discord = require('discord.js');

class HelpCommand {

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
    getCommand() {
        return {
            Command: "forcerefresh",
            Aliases: ["serverrefresh", "forceupdate"],
            Usage: "",
            Description: "**[ADMIN]** Refresh l'ensemble du serveur.",
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

        // On récupère la guilde du message et on lance le refresh forcé.
        let guild = message.guild;
        let edit = await message.channel.send("> :clock1:  **Rafraîchissement forcé** lancé pour ``" + guild.memberCount + "`` membres.");

        let newLd = await this.utils.ScoreSaber.refreshGuild(message.guild.id);
        let oldLd = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id, true)
        let ld = []

        await this.utils.ScoreSaber.asyncForEach(oldLd, async (oldPlayer) => {
            await this.utils.ScoreSaber.asyncForEach(newLd, async (newPlayer) => {
                if(oldPlayer.playerid === newPlayer.playerid) {
                    newPlayer.discordUser = oldPlayer.discordUser;
                    ld.push(newPlayer);
                }
            })
        })

        await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(ld)); // Mise à jour du leaderboard.

        await edit.edit("> :clock1:  **Rafraîchissement forcé** terminé pour ``" + guild.memberCount + "`` membres.");

    }

}

module.exports = HelpCommand;