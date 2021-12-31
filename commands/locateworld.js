const { MessageEmbed } = require('discord.js')
const { userMention, channelMention } = require('@discordjs/builders')
const { CommandError, CommandInteractionError, LeaderboardError, ScoreSaberError } = require('../utils/error')
const members = require('../controllers/members')
const leaderboard = require('../controllers/leaderboard')
const config = require('../config.json')

module.exports = {
    data: {
        name: 'locateworld',
        description: 'Affiche votre position dans le classement mondial',
        options: [
            {
                type: 'USER',
                name: 'joueur',
                description: 'Affiche la position d\'un autre membre',
                required: false
            },
            {
                type: 'INTEGER',
                name: 'rang',
                description: 'Affiche la position d\'un joueur par rapport à son rang',
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
            
            const otherMember = interaction.options.getUser('joueur')
            const rank = interaction.options.getInteger('rang')

            // On vérifie que les 2 arguments n'ont pas été passés en même temps
            if(otherMember && rank) throw new CommandInteractionError('Vous ne pouvez pas combiner les 2 arguments')

            if(rank && rank < 1) throw new CommandInteractionError('Le rang du joueur doit être supérieur ou égal à 1')

            let member

            if(otherMember) {
                // Informations sur le membre
                member = await members.getMember(otherMember.id)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou non
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

            await interaction.deferReply()

            // Données de classement ScoreSaber du joueur
            const ld = rank ? await leaderboard.getGlobalLeaderboardByPlayerRank(rank) : await leaderboard.getGlobalLeaderboardByPlayerId(member.scoreSaberId)

            // On affiche le classement
            const embed = new MessageEmbed()
                .setColor('#000000')
                .setTitle('Classement Mondial')
                .setURL('https://scoresaber.com/global')
                .setDescription(ld)
                .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })
            
            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof LeaderboardError || error instanceof ScoreSaberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
        
	}
}