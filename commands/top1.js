const { ApplicationCommandOptionType, CommandInteraction } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, Top1Error } = require('../utils/error')
const members = require('../controllers/members')
const top1 = require('../controllers/top1')
const Logger = require('../utils/logger')

module.exports = {
    data: {
        name: 'top1',
        description: 'S\'inscrire ou se désinscrire du top 1 FR',
        options: [
            {
                type: ApplicationCommandOptionType.Boolean,
                name: 'subscribe',
                description: 'True: s\'inscrire au top 1 FR, False: se désinscrire du top 1 FR',
                required: true
            }
        ],
        default_member_permissions: '0'
    },
    channels: [ 'cubeStalker' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const subscribe = interaction.options.getBoolean('subscribe')

            // Identifiant du membre exécutant la commande
            const memberId = interaction.member.id

            // Informations sur le membre
            const member = await members.getMember(memberId)
            
            // On vérifie ici si le membre a lié son compte ScoreSaber ou non
            if(!member) {
                throw new CommandInteractionError('Aucun profil ScoreSaber n\'est lié avec votre compte Discord\nℹ️ Utilisez la commande `/link` afin de lier celui-ci')
            }

            const isSubscribed = member.top1

            // Si le membre est déjà inscrit au top 1 FR
            if(isSubscribed === subscribe && subscribe === true)
                throw new Top1Error('Vous êtes déjà inscrit au top 1 FR')

            // Si le membre est déjà désinscrit du top 1 FR
            if(isSubscribed === subscribe && subscribe === false)
                throw new Top1Error('Vous êtes déjà désinscrit du top 1 FR')

            let message = ''
            if(isSubscribed) {
                await top1.subscribe(member.playerId, false)
                Logger.log('Top1FR', 'INFO', `${interaction.user.tag} est maintenant désinscrit du top 1 FR`)
                message = 'Vous êtes maintenant désinscrit du top 1 FR'
            } else {
                await top1.subscribe(member.playerId, true)
                Logger.log('Top1FR', 'INFO', `${interaction.user.tag} est maintenant sinscrit au top 1 FR`)
                message = 'Vous êtes maintenant inscrit au top 1 FR'
            }

            const embed = new Embed()
                .setColor('#2ECC71')
                .setDescription(message)
            
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