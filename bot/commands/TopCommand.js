class TopCommand {

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
    get meta() {
        return {
            name: "top",
            description: "Affiche le classement mondial",
            options: {
                "nb": {
                    "name": "nombre",
                    "type": "integer",
                    "description": "Nombre de joueurs (10 défaut, 20 max, 1 min)",
                    "required": false
                }
            }
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param interaction
     */
    async exec(interaction) {

        // On récupére l'option
        let optionNumber = interaction.options._hoistedOptions.filter((args) => args.name === "nombre")

        // On récupére le nombre de joueur souhaité
        let number = optionNumber.length > 0 && optionNumber[0].value <= 20 && optionNumber[0].value >= 1 ? optionNumber[0].value : 10

        // On récupère le leaderboard mondial.
        let lb = (await this.utils.ScoreSaber.getLeaderboard()).players;

        // On prépare la description de l'embed avec les joueurs du classement.
        let desc = "";
        for(let i = 0; i < number; i++) {
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
            desc += posShow + " - :flag_" + lb[i].country.toLowerCase() + ": **" + lb[i].playerName + "** - " + lb[i].pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp\n"
        }

        // On prépare l'embed.
        let embed = this.utils.Embed.embed();
        embed.setTitle("Classement Mondial")
            .setURL(this.config.scoresaber.url + "/global")
            .setDescription(desc)
            .setColor('#000000');

        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await interaction.reply({ embeds: [embed] });
     }

}

module.exports = TopCommand;