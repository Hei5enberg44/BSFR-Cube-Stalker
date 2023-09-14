import { Guild, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError } from '../utils/error.js'
import leaderboard from '../controllers/leaderboard.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('forcerefresh')
        .setDescription('Actualise l\'ensemble du serveur')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,
    allowedChannels: [
        config.guild.channels['cube-stalker']
    ],

    /**
     * Exécution de la commande
     * @param interaction intéraction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const leaderboardChoice = Leaderboards.ScoreSaber

            const guild = <Guild>interaction.guild

            let embed = new Embed()
                .setColor('#F1C40F')
                .setDescription('🛠️ Actualisation du serveur en cours...')

            await interaction.reply({ embeds: [embed] })

            await guild.members.fetch()
            const members = guild.members.cache
            await leaderboard.refreshLeaderboard(leaderboardChoice, members)

            embed = new Embed()
                .setColor('#2ECC71')
                .setDescription('Le serveur a bien été actualisé')

            await interaction.editReply({ embeds: [embed] })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}