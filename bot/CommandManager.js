const Filesystem = require("fs");

class CommandManager {

    constructor(opt) {
        this.config = opt.config;
        this.clients = opt.clients;
        this.utils = opt.utils;

        this.commands = {};
    }

    init() {
        Filesystem.readdirSync("./bot/commands/").forEach(file => {
            let cmd = new (require("./commands/" + file))(this);
            this.registerCommand(cmd.getCommand())
        });

        this.registerEvent()
    }

    registerCommand(command) {
        this.utils.Logger.log("CommandManager: Registered '" + command.Command + "'");
        this.commands[command.Command] = command
    }

    registerEvent() {

        this.clients.discord.getClient().on("message", message => {
            if(message.channel.id !== this.config.discord.channel)
               return;

            if(message.content.charAt(0) !== this.config.discord.prefix)
                return;

            if(message.author.bot)
                return;

            let args = message.content.split(" ");
            args[0] = args[0].replace(this.config.discord.prefix, "");

            if(this.commands[args[0]]) {
                let command = this.commands[args[0]];
                command.Run(args.slice(1), message);
                this.utils.Logger.log("CommandManager: " + message.author.username + " a run la commande " + command.Command);
            } else {
                let foundCommand;
                for(let i in this.commands) {
                    if(this.commands[i].Aliases.includes(args[0])) {
                        foundCommand = this.commands[i];
                    }
                }
                if(foundCommand) {
                    let command = foundCommand;
                    command.Run(args.slice(1), message);
                    this.utils.Logger.log("CommandManager: " + message.author.username + " a run un alias de la commande " + command.Command);
                } else {
                    message.react("❌");
                    return;
                }

            }
        });
    }

}

module.exports = CommandManager;