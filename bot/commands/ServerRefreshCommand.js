class ServerRefreshCommand {

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
    get meta() {
        return {
            name: "forcerefresh",
            description: "Rafraichir l'ensemble du serveur.",
            roles: [ "Admin", "Modérateur" ]
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param interaction
     */
    async exec(interaction) {

        // On récupère la guilde du message et on lance le refresh forcé.
        let guild = interaction.member.guild;
        await interaction.reply({ content: "> :clock1:  **Rafraîchissement forcé** lancé pour ``" + guild.memberCount + "`` membres." });

        let newLd = await this.utils.ScoreSaber.refreshGuild(guild.id);
        let oldLd = await this.utils.ServerLeaderboard.getLeaderboardServer(guild.id, true)
        let ld = []

        await this.utils.ScoreSaber.asyncForEach(oldLd, async (oldPlayer) => {
            await this.utils.ScoreSaber.asyncForEach(newLd, async (newPlayer) => {
                if(oldPlayer.playerid === newPlayer.playerid) {
                    newPlayer.discordUser = oldPlayer.discordUser;
                    ld.push(newPlayer);
                }
            })
        })

        await this.utils.ServerLeaderboard.setLeaderboardServer(guild.id, JSON.stringify(ld)); // Mise à jour du leaderboard.

        await interaction.editReply({ content: "> :clock1:  **Rafraîchissement forcé** terminé pour ``" + guild.memberCount + "`` membres." });
    }

}

module.exports = ServerRefreshCommand;