const util = require("util");

class ProfileCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "unlink",
            Aliases: ["profileunlink"],
            Usage: "<utilisateur>",
            Description: "Delink le profil.",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: false
        }
    }

    async exec(args, message) {

        let member = message.guild.members.resolve(message.author.id);
        let isAdmin = member.roles.cache.some(r=>["admin", "Admin"].includes(r.name));
        if(!isAdmin) {
            await message.react(this.config.emoji_perm);
            return;
        }

        let discordSelected, discordMember;
        if(args[0] && member.roles.cache.some(r=>["admin", "Admin"].includes(r.name))) {
            let promisifiedMember = util.promisify(this.utils.DiscordServer.getMember);
            let memberFound = await promisifiedMember(message.guild, args[0]);
            if(!memberFound) {
                await message.channel.send("> :x:  Aucun utilisateur trouvé.");
                return;
            }
            discordMember = memberFound;
            discordSelected = memberFound.user.id
        } else {
            await message.channel.send("> :x:  Veuillez indiquer un utilisateur.");
            return;
        }

        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        let leadFiltered = [];
        for(let i in leaderboardServer) {
            if(leaderboardServer[i].discordUser !== discordSelected) {
                leadFiltered.push(leaderboardServer[i]);
            }
        }
        await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leadFiltered));

        await (await this.clients.redis.quickRedis()).del(discordSelected);

        await message.channel.send("> :white_check_mark:  Compte Discord unlink: ``" + discordMember.user.tag + "``.");

    }

}

module.exports = ProfileCommand;