const { MessageEmbed } = require('discord.js')
const { userMention, channelMention } = require('@discordjs/builders')
const { CommandError, CommandInteractionError, ScoreSaberError, BeatLeaderError } = require('../utils/error')
const members = require('../controllers/members')
const cardgenerator = require('../controllers/cardgenerator')
const config = require('../config.json')
const fs = require('fs')

module.exports = {
    data: {
        name: 'card',
        description: 'Génère votre carte de joueur',
        options: [
            {
                type: 'STRING',
                name: 'leaderboard',
                description: 'Choix du leaderboard',
                choices: [
                    {
                        name: 'ScoreSaber',
                        value: 'scoresaber'
                    },
                    {
                        name: 'BeatLeader',
                        value: 'beatleader'
                    }
                ],
                required: false
            },
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
                throw new CommandInteractionError(`Merci d\'effectuer la commande dans ${channelMention(cubeStalkerChannelId)}`)

            const leaderboardChoice = interaction.options.getString('leaderboard') ?? 'scoresaber'
            const otherMember = interaction.options.getUser('joueur')

            let member
            if(otherMember) {
                // Informations sur le membre
                member = await members.getMember(otherMember.id)

                if(!member) {
                    throw new CommandInteractionError(`Aucun profil ScoreSaber n\'est lié pour le compte Discord ${userMention(otherMember.id)}`)
                }
            } else {
                // Informations sur le membre
                member = await members.getMember(interaction.member.id)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou non
                if(!member) {
                    throw new CommandInteractionError('Aucun profil ScoreSaber n\'est lié avec votre compte Discord\nℹ️ Utilisez la commande `/link` afin de lier celui-ci')
                }
            }

            const embed = new MessageEmbed()
                .setColor('#F1C40F')
                .setDescription('🛠️ Fabrication de la carte en cours...')

            await interaction.reply({ embeds: [embed] })

            const card = await cardgenerator.getCard(leaderboardChoice, member.scoreSaberId)

            await interaction.editReply({ files: [{attachment: card.name, name: member.scoreSaberId + '.png'}], embeds: [] })

            card.removeCallback()
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError || error instanceof BeatLeaderError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}