const { MessageEmbed } = require('discord.js')
const { channelMention } = require('@discordjs/builders')
const { CommandError, CommandInteractionError, MemberError, ScoreSaberError, BeatLeaderError } = require('../utils/error')
const members = require('../controllers/members')
const scoresaber = require('../controllers/scoresaber')
const beatleader = require('../controllers/beatleader')
const config = require('../config.json')

module.exports = {
    data: {
        name: 'link',
        description: 'Lie votre compte ScoreSaber ou BeatLeader à votre compte Discord',
        options: [
            {
                type: 'STRING',
                name: 'lien_leaderboard',
                description: 'Lien du profil ScoreSaber ou BeatLeader',
                required: true
            }
        ]
    },
	async execute(interaction) {
        try {
            // On vérifie que la commande est exécutée dans le bon channel
            const cubeStalkerChannelId = config.guild.channels.cubeStalker.id
            if(interaction.channelId != cubeStalkerChannelId)
                throw new CommandInteractionError(`Merci d\'effectuer la commande dans ${channelMention(cubeStalkerChannelId)}`)
            
            const url = interaction.options.getString('lien_leaderboard')

            await interaction.deferReply()

            let playerProfil
            if(url.includes('scoresaber')) {
                playerProfil = await scoresaber.getProfile(url)
            } else if(url.includes('beatleader')) {
                playerProfil = await beatleader.getProfile(url)
            } else {
                throw new CommandInteractionError('Le lien entré n\'est pas un lien ScoreSaber ou BeatLeader valide')
            }

            await members.addMember(interaction.member.id, playerProfil.id)
            
            const embed = new MessageEmbed()
                    .setColor('#2ECC71')
                    .setTitle(playerProfil.name)
                    .setURL(playerProfil.url)
                    .setThumbnail(playerProfil.avatar)
                    .setDescription('Votre profil ScoreSaber/BeatLeader a bien été lié avec votre compte Discord\nTapez la commande `/me` pour pouvoir être ajouté au classement du serveur')
                    .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })

            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError|| error instanceof BeatLeaderError || error instanceof MemberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}