const Filesystem = require("fs");

class CommandManager {

    /**
     * Constructeur du CommandManager
     * @param opt
     */
    constructor(opt) {
        this.config = opt.config;
        this.clients = opt.clients;
        this.utils = opt.utils;

        this.commands = {};
    }

    /**
     * Fonction executée à l'initialisation du CommandManager.
     */
    init() {
        // On "scan" le dossier des commandes et on ajoute les commandes.
        Filesystem.readdirSync("./bot/commands/").forEach(file => {
            let cmd = new (require("./commands/" + file))(this);
            this.registerCommand(cmd.getCommand())
        });

        // On start l'event qui écoutera les commandes/messages.
        this.registerEvent()
    }

    /**
     * Fonction d'enregistrement des commandes.
     * @param command
     */
    registerCommand(command) {
        this.utils.Logger.log("CommandManager: Registered '" + command.Command + "'");
        this.commands[command.Command] = command
    }

    /**
     * Fonction d'enregistrement de l'évènement message de discord.js
     */
    registerEvent() {

        this.clients.discord.getClient().on("message", message => {
            // La commande a-t'elle été éxecutée dans le channel de la configuration?
            if(message.channel.id !== this.config.discord.channel)
               return;

            // Le prefixe est-il bien présent?
            if(message.content.charAt(0) !== this.config.discord.prefix)
                return;

            // Aucun bot ne doit pouvoir faire de commandes.
            if(message.author.bot)
                return;

            // On établi la liste des arguments.
            let args = message.content.split(" ");

            // On retire le préfixe de la liste des arguments.
            args[0] = args[0].replace(this.config.discord.prefix, "");

            // On vérifie si la commande utilisée existe bien en tant que commande principale et non en "alias".
            if(this.commands[args[0]]) {
                // On récupère l'objet de la commande et on l'exécute.
                let command = this.commands[args[0]];
                command.Run(args.slice(1), message);
                this.utils.Logger.log("CommandManager: " + message.author.username + " a run la commande " + command.Command);
            } else {
                // On vérifie si la commande est un alias et si oui, on exécute la commande principale.
                let foundCommand;
                for(let i in this.commands) {
                    if(this.commands[i].Aliases.includes(args[0])) {
                        foundCommand = this.commands[i];
                    }
                }
                if(foundCommand) {
                    // On exécute la commande.
                    let command = foundCommand;
                    command.Run(args.slice(1), message);
                    this.utils.Logger.log("CommandManager: " + message.author.username + " a run un alias de la commande " + command.Command);
                } else {
                    // On réagis avec un X pour notifier l'utilisateur que la commande n'existe pas.
                    message.react("❌");
                    return;
                }

            }
        });
    }

}

module.exports = CommandManager;