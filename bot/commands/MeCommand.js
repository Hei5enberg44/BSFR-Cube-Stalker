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


        const value = await this.clients.redis.getInstance().get("186156892379283456");

        let player = this.utils.ScoreSaber.getProfile(value);
        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            channel.send(JSON.stringify(player));
        });
    }

}

module.exports = MeCommand;