const { MessageEmbed, MessageAttachment } = require('discord.js')
const { CommandError, CommandInteractionError, ScoreSaberError } = require('../utils/error')
const members = require('../controllers/members')
const cardgenerator = require('../controllers/cardgenerator')
const config = require('../config.json')
const fs = require('fs')

module.exports = {
    data: {
        name: 'card',
        description: 'Génère une carte de stonker certifié',
        options: [
            {
                type: 'USER',
                name: 'joueur',
                description: 'Génère la carte d\'un autre membre',
                required: false
            }
        ]
    },
	async execute(interaction) {
        try {
            // On vérifie que la commande est exécutée dans le bon channel
            const cubeStalkerChannelId = config.guild.channels.cubeStalker.id
            if(interaction.channelId != cubeStalkerChannelId)
                throw new CommandInteractionError(`Merci d\'effectuer la commande dans <#${cubeStalkerChannelId}>`)

            const otherMember = interaction.options.getUser('joueur')

            let member, memberId

            if(otherMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = otherMember.id

                // Informations sur le membre
                member = await members.getMember(memberId)

                if(!member) {
                    throw new CommandInteractionError(`Aucun profil ScoreSaber n\'est lié pour le compte Discord <@${memberId}>`)
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.member.id

                // Informations sur le membre
                member = await members.getMember(memberId)
            }

            const embed = new MessageEmbed()
                .setColor('#F1C40F')
                .setDescription(':tools: Fabrication de la carte en cours...')

            await interaction.reply({ embeds: [embed] })

            const card = await cardgenerator.getCard(member.scoreSaberId)

            await interaction.editReply({ files: [card], embeds: [] })

            fs.unlinkSync(card)
        } catch(error) {
            console.log(error)
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}