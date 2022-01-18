const { MessageEmbed } = require('discord.js')
const { channelMention, inlineCode } = require('@discordjs/builders')
const { CommandError, CommandInteractionError } = require('../utils/error')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'help',
		description: 'Affiche l\'aide'
    },
	async execute(interaction) {
        try {
            // On vérifie que la commande est exécutée dans le bon channel
            const cubeStalkerChannelId = config.guild.channels.cubeStalker.id
            if(interaction.channelId != cubeStalkerChannelId)
                throw new CommandInteractionError(`Merci d\'effectuer la commande dans ${channelMention(cubeStalkerChannelId)}`)

            const commandsList = `\
${inlineCode('/link')}: Lie votre profil ScoreSaber à votre compte Discord\n\
${inlineCode('/unlink')}: Supprime la liaison de votre profil ScoreSaber à votre compte Discord\n\
${inlineCode('/me')}: Affiche vos informations de joueur ou celles d'un autre joueur\n\
${inlineCode('/card')}: Génère votre carte de joueur ou celle d'un autre joueur\n\
${inlineCode('/ld')}: Affiche le classement du serveur (pp ou acc)\n\
${inlineCode('/locateworld')}: Affiche votre position ou celle d'un autre joueur dans le classement mondial\n\
${inlineCode('/top1')}: S\'inscire ou se désinscrire du top 1 FR\n\
${inlineCode('/world')}: Affiche le classement mondial\
`
            
            const embed = new MessageEmbed()
                .setColor('#000000')
                .setTitle('Aide')
                .addField('Liste des commandes', commandsList)
                .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })
            
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