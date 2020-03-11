const Discord = require('discord.js');

class HelpCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.commands = opt.commands;
        this.utils = opt.utils;
        this.config = opt.config;
    }

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

    async exec(args, message) {

        let member = message.guild.members.resolve(message.author.id);
        let isAdmin = member.roles.cache.some(r=>["admin", "Admin"].includes(r.name));
        if(!isAdmin) {
            await message.react(this.config.emoji_perm);
            return;
        }

        let guild = message.guild;
        let edit = await message.channel.send("> :clock1:  **Rafraîchissement forcé** lancé pour ``" + guild.memberCount + "`` membres.");

        await this.utils.ScoreSaber.refreshGuild(message.guild.id);

        await edit.edit("> :clock1:  **Rafraîchissement forcé** terminé pour ``" + guild.memberCount + "`` membres.");

    }

}

module.exports = HelpCommand;