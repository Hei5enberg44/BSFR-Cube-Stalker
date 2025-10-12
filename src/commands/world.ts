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
import { CommandError } from '../utils/error.js'
import leaderboard from '../controllers/leaderboard.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('world')
        .setDescription('Affiche le classement mondial')
        .addStringOption((option) =>
            option
                .setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
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
            const leaderboardChoice =
                (interaction.options.getString(
                    'leaderboard'
                ) as Leaderboards) ?? Leaderboards.ScoreSaber
            const count = interaction.options.getInteger('nombre') ?? 10

            const guild = interaction.guild as Guild

            // Icône Leaderboard
            const ldIconName =
                leaderboardChoice === Leaderboards.ScoreSaber
                    ? 'ss'
                    : leaderboardChoice === Leaderboards.BeatLeader
                      ? 'bl'
                      : ''
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            await interaction.deferReply({ flags: MessageFlags.Ephemeral })

            const ld = await leaderboard.getGlobalLeaderboard(
                leaderboardChoice,
                count
            )

            // On affiche le classement
            const containerBuilder = new ContainerBuilder()
                .setAccentColor(
                    leaderboardChoice === Leaderboards.ScoreSaber
                        ? [255, 222, 24]
                        : leaderboardChoice === Leaderboards.BeatLeader
                          ? [217, 16, 65]
                          : undefined
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `### ${ldIcon ? `<:${ldIconName}:${ldIconId}> ` : ''} ${hyperlink(`Classement Mondial ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}`, `https://${leaderboardChoice === Leaderboards.ScoreSaber ? 'scoresaber.com/global' : 'beatleader.com/ranking'}`)}`
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
