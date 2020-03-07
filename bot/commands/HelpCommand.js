class HelpCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.commands = opt.commands;
    }

    getCommand() {
        return {
            Command: "help",
            Usage: "!help [<username>]",
            Description: "Affiche votre profil ScoreSaber.",
            Run: (args) => this.exec(args)
        }
    }

    exec(args) {
        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {

            let showC = [];
            for(let c in this.commands) {
                showC.push(this.commands[c].Command);
            }

            channel.send(showC.join());
        });
    }

}

module.exports = HelpCommand;