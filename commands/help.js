const { inlineCode } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')

module.exports = {
    data: {
        name: 'help',
        description: 'Affiche l\'aide',
        default_member_permissions: '0'
    },
    channels: [ 'cubeStalker' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const commandsList = `\
${inlineCode('/link')}: Lie votre profil ScoreSaber/BeatLeader à votre compte Discord\n\
${inlineCode('/unlink')}: Supprime la liaison de votre profil ScoreSaber/BeatLeader à votre compte Discord\n\
${inlineCode('/me')}: Affiche vos informations de joueur ou celles d'un autre joueur\n\
${inlineCode('/card')}: Génère votre carte de joueur ou celle d'un autre joueur\n\
${inlineCode('/ld')}: Affiche le classement du serveur (pp ou acc)\n\
${inlineCode('/locateworld')}: Affiche votre position ou celle d'un autre joueur dans le classement mondial\n\
${inlineCode('/top1')}: S\'inscire ou se désinscrire du top 1 FR\n\
${inlineCode('/world')}: Affiche le classement mondial\
`
            
            const embed = new Embed()
                .setColor('#000000')
                .setTitle('Aide')
                .addFields({ name: 'Liste des commandes', value: commandsList })
            
            await interaction.reply({ embeds: [ embed ], ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof Top1Error) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}