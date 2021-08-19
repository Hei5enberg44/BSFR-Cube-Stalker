class UnlinkCommand {

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
            name: "unlink",
            description: "Délier un profil ScoreSaber d'un profil Discord",
            options: {
                "player": {
                    "name": "joueur",
                    "type": "user",
                    "description": "Profil à délier",
                    "required": true
                }
            },
            roles: [ "Admin", "Modérateur" ]
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param interaction
     */
    async exec(interaction) {

        // On récupère l'objet membre.
        let member = interaction.options._hoistedOptions.filter((args) => args.name === "joueur")[0].member

        // On récupère le leaderboard serveur.
        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(member.guild.id, true);

        // On fait en sorte de filtrer le leaderboard de l'utilisateur qui vient d'être unlink.
        let leadFiltered = [];
        for(let i in leaderboardServer) {
            if(leaderboardServer[i].discordUser !== member.user.id) {
                leadFiltered.push(leaderboardServer[i]);
            }
        }
        // On met à jour le leaderboard.
        await this.utils.ServerLeaderboard.setLeaderboardServer(message.guild.id, JSON.stringify(leadFiltered));

        // On supprime la clé Redis contenant l'ID ScoreSaber.
        await (await this.clients.redis.quickRedis()).del(member.user.id);

        // On renvoie une confirmation.
        await interaction.reply({ content: "> :white_check_mark:  Compte Discord unlink: ``" + member.user.tag + "``." });
    }
}

module.exports = UnlinkCommand;