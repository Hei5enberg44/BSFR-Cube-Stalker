class LeaderboardAccuracyCommand {

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
            name: "ldacc",
            description: "Affiche le classement de précision du serveur.",
            options: {
                "page": {
                    "name": "page",
                    "type": "number",
                    "description": "Page à afficher",
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

        // On récupère le leaderboard du serveur.
        let lb = await this.utils.ServerLeaderboard.getLeaderboardServer(interaction.member.guild.id, false);

        // On récupére l'option
        let optionPage = interaction.options._hoistedOptions.filter((args) => args.name === "page")

        // On récupère la page et on vérifie si la page mentionnée est valide.
        let tempPage = optionPage.length > 0 ? optionPage[0].value : 1

        // On impose les limites des pages.
        let page = tempPage - 1;
        let beginning = (page * 10) + 1;
        let end = beginning + 9;

        // On regarde le nombre de pages qu'on a.
        let nombreDePages = 0;
        for(let i = 0; i <= lb.length; i++) {
            if((i % 10) === 0) {
                nombreDePages++;
            }
        }

        // On vérifie que la page indiquée n'excède pas le nombre de pages.
        if(tempPage > nombreDePages) {
            await interaction.reply({ content: "> :x:  Il n'y a que ``" + nombreDePages + "`` pages dans ce leaderboard.", ephemeral: true});
            return;
        }

        // On prépare la description de l'embed avec les joueurs du classement.
        let desc = "";
        let pos = 0;
        for(let i in lb) {

            // On incrémente pos de 1.
            pos++;

            if(pos >= beginning && pos <= end) {
                // Petite médaille du plaisir (ou pas).
                let posShow;
                if (pos === 1) {
                    posShow = ":first_place:"
                } else if (pos === 2) {
                    posShow = ":second_place:"
                } else if (pos === 3) {
                    posShow = ":third_place:"
                } else {
                    posShow = "#" + pos;
                }

                if("acc" in lb[i]) {
                    // On ajoute une ligne à la description.
                    desc += posShow + " - :flag_" + lb[i].country.toLowerCase() + ": [" + lb[i].name + "](https://scoresaber.com/u/" + lb[i].playerid + ") - " + lb[i].acc.toFixed(2) + "%\n"
                }
            }
        }

        desc += "\nPage ``" + tempPage + "`` sur ``" + nombreDePages + "``";

        // On prépare l'embed.
        let embed = this.utils.Embed.embed();
        if(lb.length) {

            // Joueur ou joueurs?
            let j = "joueur";
            if(lb.length !== 1) {
                j = "joueurs"
            }

            // On modifie l'embed standardisé.
            embed.setTitle("Classement Précision Serveur (" + lb.length + " " + j + ")")
                .setDescription(desc)
                .setColor('#000000');
        } else {
            // On modifie l'embed standardisé pour afficher qu'aucun joueur n'est dans le leaderboard serveur.
            embed.setTitle("Classement Précision Serveur")
                .setDescription("Aucun joueur enregistré sur ce serveur.")
                .setColor('#000000');
        }

        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await interaction.reply({embeds: [embed]});
     }

}

module.exports = LeaderboardAccuracyCommand;