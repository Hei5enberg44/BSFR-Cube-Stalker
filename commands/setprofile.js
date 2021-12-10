const { MessageEmbed } = require('discord.js')
const { userMention, channelMention } = require('@discordjs/builders')
const { CommandError, CommandInteractionError, MemberError, ScoreSaberError } = require('../utils/error')
const members = require('../controllers/members')
const scoresaber = require('../controllers/scoresaber')
const config = require('../config.json')

module.exports = {
    data: {
        name: 'setprofile',
        description: 'Lie un compte ScoreSaber à un compte Discord',
        options: [
            {
                type: 'STRING',
                name: 'lien_scoresaber',
                description: 'Lien du profil ScoreSaber',
                required: true
            },
            {
                type: 'USER',
                name: 'joueur',
                description: 'Joueur à lier',
                required: true
            }
        ],
        defaultPermission: false
    },
    roles: [ "Admin", "Modérateur" ],
	async execute(interaction) {
        try {
            // On vérifie que la commande est exécutée dans le bon channel
            const cubeStalkerChannelId = config.guild.channels.cubeStalker.id
            if(interaction.channelId != cubeStalkerChannelId)
                throw new CommandInteractionError(`Merci d\'effectuer la commande dans ${channelMention(cubeStalkerChannelId)}`)
            
            const url = interaction.options.getString('lien_scoresaber')
            const member = interaction.options.getUser('joueur')

            await interaction.deferReply()

            const scoreSaberProfil = await scoresaber.getProfile(url)

            await members.addMember(member.id, scoreSaberProfil.id, true)
            
            const embed = new MessageEmbed()
                    .setColor('#2ECC71')
                    .setTitle(scoreSaberProfil.name)
                    .setURL(scoreSaberProfil.url)
                    .setThumbnail(scoreSaberProfil.avatar)
                    .setDescription(`Le profil ScoreSaber a bien été lié avec le compte Discord de ${userMention(member.id)}`)
                    .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)

            await interaction.editReply({ embeds: [embed] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError || error instanceof MemberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}