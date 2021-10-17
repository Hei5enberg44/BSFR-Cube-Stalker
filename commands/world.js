const { MessageEmbed } = require('discord.js')
const { CommandError, CommandInteractionError, LeaderboardError } = require('../utils/error')
const leaderboard = require('../controllers/leaderboard')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'world',
		description: 'Affiche le classement mondial',
        options: [
            {
                type: 'INTEGER',
                name: 'nombre',
                description: 'Nombre de joueurs à afficher (10 par défaut, 20 maximum)',
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
            
            const count = interaction.options.getInteger('nombre') ?? 10

            if(count < 1 || count > 20) throw new CommandInteractionError('Le nombre de joueurs à afficher doit être compris entre 1 et 20')

            await interaction.deferReply()

            const ld = await leaderboard.getGlobalLeaderboard(count)

            // On affiche le classement
            const embed = new MessageEmbed()
                .setColor('#000000')
                .setTitle('Classement Mondial')
                .setURL('https://scoresaber.com/global')
                .setDescription(ld)
                .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)
            
            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof LeaderboardError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}