class MeCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "profile",
            Usage: "!profile <link>",
            Description: "Lie votre compte ScoreSaber à votre compte Discord.",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {
        if(!args[0]) {
            await message.channel.send("> :x: | Veuillez indiquer un profil ScoreSaber.")
            return;
        }
        if(!(args[0].indexOf("https://scoresaber.com/u/") > -1)) {
            await message.channel.send("> :x: | Veuillez indiquer un profil ScoreSaber valide.")
            return;
        }

        let profileId = args[0].replace("https://scoresaber.com/u/", "");

        await this.clients.redis.loginRedis();
        await this.clients.redis.getInstance().set(message.author.id, profileId);
        this.clients.redis.logoutRedis();

        let player = await this.utils.ScoreSaber.getProfile(profileId);
        await message.channel.send("> :white_check_mark: | Le profil ScoreSaber ``" + player.name + "`` a bien été lié avec votre compte Discord.")
    }

}

module.exports = MeCommand;