import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} from 'discord.js'
import { CommandError } from '../utils/error.js'
import leaderboard from '../controllers/leaderboard.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('forcerefresh')
        .setDescription('Actualise l\'ensemble du serveur')
        .addStringOption(option =>
            option.setName('leaderboard')
                .setDescription('Leaderboard a actualiser')
                .addChoices([
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
                ])
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild)
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
            const leaderboardChoice = interaction.options.getString('leaderboard') as Leaderboards

            const guild = <Guild>interaction.guild

            let containerBuilder = new ContainerBuilder()
                .setAccentColor([ 241, 196, 15 ])
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('### 🛠️ Actualisation du serveur en cours...')
                )

            await interaction.reply({
                flags: [
                    MessageFlags.IsComponentsV2,
                    MessageFlags.Ephemeral
                ],
                components: [ containerBuilder ]
            })

            const members = guild.members.cache
            await leaderboard.refreshLeaderboard(leaderboardChoice, members)

            containerBuilder = new ContainerBuilder()
                .setAccentColor([ 46, 204, 113 ])
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('### ✅ Le serveur a bien été actualisé')
                )

            await interaction.editReply({
                flags: [
                    MessageFlags.IsComponentsV2
                ],
                components: [ containerBuilder ]
            })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}