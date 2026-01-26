import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ApplicationCommand,
    inlineCode,
    userMention,
    chatInputApplicationCommandMention,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    hyperlink,
    MessageFlags
} from 'discord.js'
import players from '../controllers/players.js'
import leaderboard from '../controllers/leaderboard.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('locateworld')
        .setDescription('Affiche votre position dans le classement mondial')
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
        .addUserOption((option) =>
            option
                .setName('joueur')
                .setDescription("Affiche la position d'un autre membre")
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('rang')
                .setDescription(
                    "Affiche la position d'un joueur par rapport à son rang"
                )
                .setMinValue(1)
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
            const targetMember = interaction.options.getUser('joueur')
            const rank = interaction.options.getInteger('rang')

            const guild = interaction.client.guilds.cache.get(
                config.guild.id
            ) as Guild
            const applicationCommands =
                interaction.client.application.commands.cache

            // On vérifie que les 2 arguments n'ont pas été passés en même temps
            if (targetMember && rank)
                throw new CommandInteractionError(
                    `Vous ne pouvez pas combiner les options ${inlineCode('joueur')} et ${inlineCode('rang')}`
                )

            let player, memberId

            if (targetMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = targetMember.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if (!player) {
                    throw new CommandInteractionError(
                        `Aucun profil ${leaderboardChoice} n'est lié pour le compte Discord ${userMention(memberId)}`
                    )
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.user.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if (!player) {
                    const linkCommand = applicationCommands.find(
                        (c) => c.name === 'link'
                    ) as ApplicationCommand
                    throw new CommandInteractionError(
                        `Aucun profil ${leaderboardChoice} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`
                    )
                }
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral })

            // Données de classement ScoreSaber du joueur
            const ld = rank
                ? await leaderboard.getGlobalLeaderboardByPlayerRank(
                      leaderboardChoice,
                      rank
                  )
                : await leaderboard.getGlobalLeaderboardByPlayerId(
                      leaderboardChoice,
                      player.playerId
                  )

            // Icône Leaderboard
            const ldIconName = GameLeaderboard.getLdIconName(leaderboardChoice)
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            // On affiche le classement
            const containerBuilder = new ContainerBuilder()
                .setAccentColor(GameLeaderboard.getLdColor(leaderboardChoice))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `### ${ldIcon ? `<:${ldIconName}:${ldIconId}> ` : ''} ${hyperlink(`Classement Mondial ${leaderboardChoice}`, `https://${leaderboardChoice.toLowerCase()}.com/${leaderboardChoice === Leaderboards.ScoreSaber ? 'global' : leaderboardChoice === Leaderboards.BeatLeader ? 'ranking' : 'leaderboards'}`)}`
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
                error.name === 'LEADERBOARD_ERROR' ||
                error.name === 'SCORESABER_ERROR' ||
                error.name === 'BEATLEADER_ERROR' ||
                error.name === 'ACCSABER_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
