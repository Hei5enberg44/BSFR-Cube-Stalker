const { MessageEmbed } = require('discord.js')
const { CommandError, CommandInteractionError, MemberError, ScoreSaberError } = require('../utils/error')
const members = require('../controllers/members')
const scoresaber = require('../controllers/scoresaber')
const config = require('../config.json')

module.exports = {
    data: {
        name: 'link',
        description: 'Lie votre compte ScoreSaber à votre compte Discord',
        options: [
            {
                type: 'STRING',
                name: 'lien_scoresaber',
                description: 'Lien du profil ScoreSaber',
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
            
            const url = interaction.options.getString('lien_scoresaber')

            await interaction.deferReply()

            const scoreSaberProfil = await scoresaber.getProfil(url)

            await members.addMember(interaction.member.id, scoreSaberProfil.id)
            
            const embed = new MessageEmbed()
                    .setColor('#2ECC71')
                    .setTitle(scoreSaberProfil.name)
                    .setURL(scoreSaberProfil.url)
                    .setThumbnail(scoreSaberProfil.avatar)
                    .setDescription('Votre profil ScoreSaber a bien été lié avec votre compte Discord\nTapez la commande `/me` pour pouvoir être ajouté au classement du serveur')
                    .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)

            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError || error instanceof MemberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}