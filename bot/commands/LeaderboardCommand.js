class LeaderboardCommand {

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
            Command: "leaderboard",
            Aliases: ["ld", "server", "serverlead", "lead", "top"],
            Usage: "[<page>]",
            Description: "Affiche le classement du serveur.",
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

        // On récupère le leaderboard du serveur.
        let lb = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        // On récupère la page et on vérifie si la page mentionnée est valide.
        let tempPage;

        // Si aucun argument, on donne la première page.
        if(args[0]) {
            if(!parseInt(args[0]) || args[0] < 1) {
                await message.channel.send("> :x:  Veuillez indiquer un numéro de page valide.");
                return;
            }
            tempPage = args[0];
        } else {
            tempPage = 1;
        }

        // On impose les limites des pages.
        let page = parseInt(tempPage) - 1;
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
            await message.channel.send("> :x:  Il n'y a que ``" + nombreDePages + "`` pages dans ce leaderboard.");
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

                // On ajoute une ligne à la description.
                desc += posShow + " - :flag_" + lb[i].country.toLowerCase() + ": [" + lb[i].name + "](https://scoresaber.com/u/" + lb[i].playerid + ") - " + lb[i].pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp\n"
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
            embed.setTitle("Classement Serveur (" + lb.length + " " + j + ")")
                .setDescription(desc)
                .setColor('#000000');
        } else {
            // On modifie l'embed standardisé pour afficher qu'aucun joueur n'est dans le leaderboard serveur.
            embed.setTitle("Classement Serveur")
                .setDescription("Aucun joueur enregistré sur ce serveur.")
                .setColor('#000000');
        }

        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await message.channel.send(embed);
     }

}

module.exports = LeaderboardCommand;