class MeCommand {

    /**
     * Constructeur de la commande
     * @param opt
     */
    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    /**
     * Permet de récupérer la "metadata" de la commande.
     * @returns {{Usage: string, Description: string, Command: string, ShowInHelp: boolean, Run: (function(*=, *=): void), Aliases: [string, string]}}
     */
    getCommand() {
        return {
            Command: "world",
            Aliases: ["worldlead"],
            Usage: "[<nb>]",
            Description: "Affiche le classement mondial (10 défaut, 20 max, 1 min)",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: true
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param args
     * @param message
     */
    async exec(args, message) {

        // On regarde combien de joueurs doivent être affichés.
        let nb = args[0];
        if (!nb) {
            nb = 10
        } else if((nb > 20 || nb < 1) || isNaN(parseInt(nb))) {
            await message.channel.send("> :slight_smile:  Le top 10 sera affiché.");
            nb = 10
        }

        // On récupère le leaderboard mondial.
        let lb = await this.utils.ScoreSaber.getLeaderboard();

        // On prépare la description de l'embed avec les joueurs du classement.
        let desc = "";
        for(let i = 0; i < nb; i++) {
            let posShow;

            // La médaille du plaisirrrr
            if(lb[i].rank === 1) {
                posShow = ":first_place:"
            } else if(lb[i].rank === 2) {
                posShow = ":second_place:"
            } else if(lb[i].rank === 3) {
                posShow = ":third_place:"
            } else {
                posShow = "#" + lb[i].rank;
            }

            // On ajoute une ligne à la description.
            desc += posShow + " - :flag_" + lb[i].country.toLowerCase() + ": **" + lb[i].name + "** - " + lb[i].pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp\n"
        }

        // On prépare l'embed.
        let embed = this.utils.Embed.embed();
        embed.setTitle("Classement Mondial")
            .setURL(this.config.scoresaber.url + "/global")
            .setDescription(desc)
            .setColor('#000000');

        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await message.channel.send(embed);
     }

}

module.exports = MeCommand;