class MeCommand {

    constructor(opt) {
        this.clients = opt.clients
    }

    getCommand() {
        return {
            Command: "me",
            Usage: "!me [<username>]",
            Description: "Affiche votre profil ScoreSaber.",
            Run: (args) => this.exec(args)
        }
    }

    exec(args) {
        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            channel.send(":ok_hand:");
        });
    }

}

module.exports = MeCommand;