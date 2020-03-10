class DiscordServer {

    constructor(opt) {
        this.clients = opt.clients;
    }

    getMember(guild, name, callback) {
        let re = new RegExp(name.toLowerCase(), "g");
        let found = false;
        guild.members.fetch().then((members) => {
            members.forEach((member) => {
                if (member.user.username.toLowerCase().match(re, "/^\[[^\[\]]+\] " + name.toLowerCase() + "$") !== null) {
                    callback(false, member)
                    found = true;
                } else if (member.nickname) {
                    if (member.nickname.toLowerCase().match(re, "/^\[[^\[\]]+\] " + name.toLowerCase() + "$") !== null) {
                        callback(false, member);
                        found = true;
                    }
                }
            });
        });
        setTimeout(() => {
            callback(false, undefined);
        }, 5000);
    }

}

module.exports = DiscordServer;