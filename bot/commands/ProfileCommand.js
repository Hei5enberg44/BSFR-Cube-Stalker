class MeCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "profile",
            Aliases: ["profilelink", "link"],
            Usage: "<link>",
            Description: "Lie votre compte ScoreSaber à votre compte Discord.",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {
        let url = "http";
        if(!args[0]) {
            await message.channel.send("> :x:  Veuillez indiquer un profil ScoreSaber.")
            return;
        }

        if(args[0].indexOf("https") > -1) {
            url = "https"
        }

        url += "://scoresaber.com/u/";

        if(!(args[0].indexOf(url) > -1)) {
            await message.channel.send("> :x:  Veuillez indiquer un profil ScoreSaber valide.")
            return;
        }

        let profileId = args[0].replace(url , "");
        
        profileId = profileId.split("?")[0];
        profileId = profileId.split("&")[0];

        /*await this.clients.redis.loginRedis();
        await this.clients.redis.getInstance().set(message.author.id, profileId);
        this.clients.redis.logoutRedis();*/

        await (await this.clients.redis.quickRedis()).set(message.author.id, profileId);

        let player = await this.utils.ScoreSaber.getProfile(profileId);
        await message.channel.send("> :white_check_mark:  Le profil ScoreSaber ``" + player.name + "`` a bien été lié avec votre compte Discord.")
    }

}

module.exports = MeCommand;