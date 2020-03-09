class DiscordServer {

    constructor(opt) {
        this.clients = opt.clients;
    }

    getMember(guild, name, callback) {
        let re = new RegExp(name.toLowerCase(), "g");
        guild.members.fetch().then((members) => {
            members.forEach((member) => {
                if (member.user.username.toLowerCase().match(re, "/^\[[^\[\]]+\] " + name.toLowerCase() + "$") !== null) {
                    callback(false, member)
                } else if (member.nickname) {
                    if (member.nickname.toLowerCase().match(re, "/^\[[^\[\]]+\] " + name.toLowerCase() + "$") !== null) {
                        callback(false, member)
                    }
                }
            });
        });
    }

}

module.exports = DiscordServer;