import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    hyperlink
} from 'discord.js'
import leaderboard from '../controllers/leaderboard.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'
import { CommandError } from '../utils/error.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('world')
        .setDescription('Affiche le classement mondial')
        .addStringOption((option) =>
            option
                .setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: Leaderboards.ScoreSaber },
                    { name: 'BeatLeader', value: Leaderboards.BeatLeader },
                    { name: 'AccSaber', value: Leaderboards.AccSaber }
                )
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('nombre')
                .setDescription(
                    'Nombre de joueurs à afficher (10 par défaut, 20 maximum)'
                )
                .setMinValue(1)
                .setMaxValue(20)
                .setRequired(false)
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    allowedChannels: [config.guild.channels['cube-stalker']],

    /**
     * Exécution de la commande
     * @param interaction intéraction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const leaderboardName =
                (interaction.options.getString(
                    'leaderboard'
                ) as Leaderboards) ?? Leaderboards.ScoreSaber
            const count = interaction.options.getInteger('nombre') ?? 10

            const guild = interaction.client.guilds.cache.get(
                config.guild.id
            ) as Guild

            // Icône Leaderboard
            const ldIconName = GameLeaderboard.getLdIconName(leaderboardName)
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            await interaction.deferReply({ flags: MessageFlags.Ephemeral })

            const ld = await leaderboard.getGlobalLeaderboard(
                leaderboardName,
                count
            )

            // On affiche le classement
            const containerBuilder = new ContainerBuilder()
                .setAccentColor(GameLeaderboard.getLdColor(leaderboardName))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `### ${ldIcon ? `<:${ldIconName}:${ldIconId}> ` : ''} ${hyperlink(`Classement Mondial ${leaderboardName}`, `https://${leaderboardName.toLowerCase()}.com/${leaderboardName === Leaderboards.ScoreSaber ? 'global' : leaderboardName === Leaderboards.BeatLeader ? 'ranking' : 'leaderboards'}`)}`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(ld)
                )

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [containerBuilder]
            })
        } catch (error) {
            if (
                error.name === 'COMMAND_INTERACTION_ERROR' ||
                error.name === 'LEADERBOARD_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
