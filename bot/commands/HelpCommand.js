class HelpCommand {

    /**
     * Constructeur de la commande
     * @param opt
     */
    constructor(opt) {
        this.clients = opt.clients;
        this.commands = opt.commands;
        this.utils = opt.utils;
        this.config = opt.config;
    }

    /**
     * Permet de récupérer la "metadata" de la commande.
     * @returns {{Usage: string, Description: string, Command: string, ShowInHelp: boolean, Run: (function(*=, *=): void), Aliases: [string, string]}}
     */
    getCommand() {
        return {
            Command: "help",
            Aliases: ["cmds", "plshelp"],
            Usage: "",
            Description: "Affiche la liste des commandes.",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: false
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param args
     * @param message
     */
    async exec(args, message) {

        // On liste les commandes dans cet array de façon humaine.
        let showC = [];
        for(let c in this.commands) {
            if(this.commands[c].ShowInHelp)
                showC.push({name: this.config.discord.prefix + this.commands[c].Command + " " + this.commands[c].Usage, value: this.commands[c].Description + "\nAlias: ``" + this.commands[c].Aliases.join("``, ``") + "``", inline: false});
        }

        // On prépare l'embed et on ajoute les fields.
        let embed = this.utils.Embed.embed();
        embed.setTitle('Liste des commandes').addFields(...showC);

        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await message.channel.send(embed);
    }

}

module.exports = HelpCommand;