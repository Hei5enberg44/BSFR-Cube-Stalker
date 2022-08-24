const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')
const leaderboard = require('../controllers/leaderboard')

module.exports = {
    data: {
        name: 'forcerefresh',
        description: 'Actualise l\'ensemble du serveur',
        default_member_permissions: '0'
    },
    roles: [ 'Admin', 'Modérateur' ],
    channels: [ 'cubeStalker' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            let embed = new Embed()
                .setColor('#F1C40F')
                .setDescription('🛠️ Actualisation du serveur en cours...')

            await interaction.reply({ embeds: [embed] })

            await interaction.guild.members.fetch()
            const members = interaction.guild.members.cache
            await leaderboard.refreshLeaderboard(members)

            embed = new Embed()
                .setColor('#2ECC71')
                .setDescription('Le serveur a bien été actualisé')

            await interaction.editReply({ embeds: [embed] })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}