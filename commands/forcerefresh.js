const { MessageEmbed } = require('discord.js')
const { channelMention } = require('@discordjs/builders')
const { CommandError, CommandInteractionError } = require('../utils/error')
const leaderboard = require('../controllers/leaderboard')
const config = require('../config.json')

module.exports = {
    data: {
        name: 'forcerefresh',
        description: 'Actualise l\'ensemble du serveur',
        defaultPermission: false
    },
    roles: [ "Admin", "Modérateur" ],
	async execute(interaction) {
        try {
            // On vérifie que la commande est exécutée dans le bon channel
            const cubeStalkerChannelId = config.guild.channels.cubeStalker.id
            if(interaction.channelId != cubeStalkerChannelId)
                throw new CommandInteractionError(`Merci d\'effectuer la commande dans ${channelMention(cubeStalkerChannelId)}`)
            
            let embed = new MessageEmbed()
                .setColor('#F1C40F')
                .setDescription('🛠️ Actualisation du serveur en cours...')

            await interaction.reply({ embeds: [embed] })

            await interaction.guild.members.fetch()
            const members = interaction.guild.members.cache
            await leaderboard.refreshLeaderboard(members)

            embed = new MessageEmbed()
                .setColor('#2ECC71')
                .setDescription('Le serveur a bien été actualisé')

            await interaction.editReply({ embeds: [embed] })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}