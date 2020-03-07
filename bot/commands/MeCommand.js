class MeCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.utils = opt.utils;
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
        this.utils.ScoreSaber.getInfo();
        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            channel.send(":ok_hand:");
        });
    }

}

module.exports = MeCommand;