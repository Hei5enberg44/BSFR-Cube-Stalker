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
import leaderboard from '../controllers/leaderboard.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import { CommandError } from '../utils/error.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('forcerefresh')
        .setDescription("Actualise l'ensemble du serveur")
        .addStringOption((option) =>
            option
                .setName('leaderboard')
                .setDescription('Leaderboard a actualiser')
                .addChoices([
                    { name: 'ScoreSaber', value: Leaderboards.ScoreSaber },
                    { name: 'BeatLeader', value: Leaderboards.BeatLeader }
                ])
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    allowedChannels: [config.guild.channels['cube-stalker']],

    /**
     * Exécution de la commande
     * @param interaction intéraction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const leaderboardName = interaction.options.getString(
                'leaderboard'
            ) as Leaderboards

            const guild = interaction.client.guilds.cache.get(
                config.guild.id
            ) as Guild

            let containerBuilder = new ContainerBuilder()
                .setAccentColor([241, 196, 15])
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### 🛠️ Actualisation du serveur en cours...'
                    )
                )

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [containerBuilder]
            })

            const members = guild.members.cache
            await leaderboard.refreshLeaderboard(leaderboardName, members)

            containerBuilder = new ContainerBuilder()
                .setAccentColor([46, 204, 113])
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### ✅ Le serveur a bien été actualisé'
                    )
                )

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [containerBuilder]
            })
        } catch (error) {
            if (error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
