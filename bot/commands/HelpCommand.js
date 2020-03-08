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
            Command: "help",
            Usage: "!help",
            Description: "Affiche la liste des commandes.",
            Run: (args, message) => this.exec(args, message)
        }
    }

    exec(args, message) {
        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {

            let showC = [];
            for(let c in this.commands) {
                showC.push({name: this.commands[c].Usage, value: this.commands[c].Description, inline: false});
            }

            let embed = this.utils.Embed.embed();
            embed.setTitle('Liste des commandes').addFields(...showC);

            channel.send(embed);
        });
    }

}

module.exports = HelpCommand;