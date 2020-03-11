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
            Aliases: ["cmds", "plshelp"],
            Usage: "",
            Description: "Affiche la liste des commandes.",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: false
        }
    }

    exec(args, message) {
        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {

            let showC = [];
            for(let c in this.commands) {
                if(this.commands[c].ShowInHelp)
                    showC.push({name: this.config.discord.prefix + this.commands[c].Command + " " + this.commands[c].Usage, value: this.commands[c].Description + "\nAlias: ``" + this.commands[c].Aliases.join("``, ``") + "``", inline: false});
            }

            let embed = this.utils.Embed.embed();
            embed.setTitle('Liste des commandes').addFields(...showC);

            channel.send(embed);
        });
    }

}

module.exports = HelpCommand;