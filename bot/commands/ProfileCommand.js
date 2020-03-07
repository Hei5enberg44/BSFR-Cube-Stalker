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
            Run: (args) => this.exec(args)
        }
    }

    exec(args) {
        //this.clients.redis.getInstance().set()
    }

}

module.exports = MeCommand;