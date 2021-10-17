const { MessageEmbed } = require('discord.js')
const { CommandError, CommandInteractionError, Top1Error } = require('../utils/error')
const members = require('../controllers/members')
const top1 = require('../controllers/top1')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'top1',
		description: 'S\'inscire ou se désinscrire du top 1 FR',
        options: [
            {
                type: 'BOOLEAN',
                name: 'subscribe',
                description: 'True: s\'inscrire au top 1 FR, False: se désinscrire du top 1 FR',
                required: true
            }
        ]
    },
	async execute(interaction) {
        try {
            // On vérifie que la commande est exécutée dans le bon channel
            const cubeStalkerChannelId = config.guild.channels.cubeStalker.id
            if(interaction.channelId != cubeStalkerChannelId)
                throw new CommandInteractionError(`Merci d\'effectuer la commande dans <#${cubeStalkerChannelId}>`)
            
            const subscribe = interaction.options.getBoolean('subscribe')

            // Identifiant du membre exécutant la commande
            const memberId = interaction.member.id

            // Informations sur le membre
            const member = await members.getMember(memberId)
            
            // On vérifie ici si le membre a lié son compte ScoreSaber ou non
            if(!member) {
                throw new CommandInteractionError('Aucun profil ScoreSaber n\'est lié avec votre compte Discord\n:information_source: Utilisez la commande `/link` afin de lier celui-ci')
            }

            const isSubscribed = await top1.isSubscribed(memberId)

            // Si le membre est déjà inscrit au top 1 FR
            if(isSubscribed === subscribe && subscribe === true)
                throw new Top1Error('Vous êtes déjà inscrit au top 1 FR')

            // Si le membre est déjà désinscrit du top 1 FR
            if(isSubscribed === subscribe && subscribe === false)
                throw new Top1Error('Vous êtes déjà désinscrit du top 1 FR')

            let message = ''
            if(isSubscribed) {
                await top1.subscribe(memberId, false)
                message = 'Vous êtes maintenant désinscrit du top 1 FR'
            } else {
                await top1.subscribe(memberId, true)
                message = 'Vous êtes maintenant inscrit au top 1 FR'
            }

            const embed = new MessageEmbed()
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