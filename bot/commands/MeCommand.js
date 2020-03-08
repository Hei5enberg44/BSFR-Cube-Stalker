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
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {
        await this.clients.redis.loginRedis();
        const value = await this.clients.redis.getInstance().get(message.author.id);
        this.clients.redis.logoutRedis();

        console.log(value);

        let player = await this.utils.ScoreSaber.getProfile(value);
        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            channel.send(JSON.stringify(player));
        });
    }

}

module.exports = MeCommand;