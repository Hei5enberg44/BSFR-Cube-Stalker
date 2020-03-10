const util = require("util");

class ProfileCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "profile",
            Aliases: ["profilelink", "link"],
            Usage: "<link> (<utilisateur>)",
            Description: "Lie votre compte ScoreSaber à votre compte Discord.",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {

        let member = message.guild.members.resolve(message.author.id);

        let discordSelected, discordMember;
        if(args[1] && member.roles.cache.some(r=>["admin", "Admin"].includes(r.name))) {
            let promisifiedMember = util.promisify(this.utils.DiscordServer.getMember);
            let memberFound = await promisifiedMember(message.guild, args[1]);
            if(!memberFound) {
                await message.channel.send("> :x:  Aucun utilisateur trouvé.");
                return;
            }
            discordMember = memberFound;
            discordSelected = memberFound.user.id
        } else {
            discordSelected = message.author.id;
            discordMember = message.author
        }

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

        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        let foundProfile = false;
        for(let i in leaderboardServer) {
            console.log(leaderboardServer[i].playerid + " - " + profileId);
            if(parseInt(leaderboardServer[i].playerid) === parseInt(profileId)) {
                foundProfile = true;
                console.log("BIGOOF");
                break;
            }
        }
        if(foundProfile) {
            await message.channel.send("> :x:  Ce profil ScoreSaber est déjà relié à un compte Discord.");
            return;
        }

        let leadFiltered = [];
        for(let i in leaderboardServer) {
            if(leaderboardServer[i].discordUser !== discordSelected) {
                leadFiltered.push(leaderboardServer[i]);
            }
        }
        await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leadFiltered));

        await (await this.clients.redis.quickRedis()).set(discordSelected, profileId);

        let player = await this.utils.ScoreSaber.getProfile(profileId, message, discordSelected);
        if(message.author.id === discordSelected)
            await message.channel.send("> :white_check_mark:  Le profil ScoreSaber ``" + player.name + "`` a bien été lié avec votre compte Discord.\nAstuce: Tapez la commande ``" + this.config.discord.prefix + "me`` pour pouvoir être ajouté au classement du serveur.");
        else
            await message.channel.send("> :white_check_mark:  Le profil ScoreSaber ``" + player.name + "`` a bien été lié avec le compte Discord ``" + discordMember.user.tag + "``.");

    }

}

module.exports = ProfileCommand;