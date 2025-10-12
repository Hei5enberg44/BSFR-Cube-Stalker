import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    userMention,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
    SectionBuilder,
    ThumbnailBuilder,
    hyperlink
} from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import players from '../controllers/players.js'
import {
    GameLeaderboard,
    Leaderboards
} from '../controllers/gameLeaderboard.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('setprofile')
        .setDescription(
            'Lie un compte ScoreSaber ou BeatLeader à un compte Discord'
        )
        .addStringOption((option) =>
            option
                .setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('url')
                .setDescription('Lien du profil ScoreSaber ou BeatLeader')
                .setRequired(true)
        )
        .addUserOption((option) =>
            option
                .setName('joueur')
                .setDescription('Joueur à lier')
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
            const leaderboardChoice = interaction.options.getString(
                'leaderboard',
                true
            ) as Leaderboards
            const url = interaction.options.getString('url', true)
            const member = interaction.options.getUser('joueur', true)

            const guild = interaction.guild as Guild

            await interaction.deferReply()

            if (!url.includes(leaderboardChoice))
                throw new CommandInteractionError(
                    `Le lien entré n\'est pas un lien ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} valide`
                )

            const gameLeaderboard = new GameLeaderboard(leaderboardChoice)
            const playerProfil = await gameLeaderboard.requests.getProfile(url)

            // On ne lie pas le profil du joueur si celui-ci est banni du leaderboard
            if (playerProfil.banned)
                throw new CommandInteractionError(
                    'Impossible de lier le profil de ce joueur car celui-ci est banni'
                )

            await players.add(
                member.id,
                playerProfil.id,
                leaderboardChoice,
                true
            )

            // Icône Leaderboard
            const ldIconName =
                leaderboardChoice === Leaderboards.ScoreSaber
                    ? 'ss'
                    : leaderboardChoice === Leaderboards.BeatLeader
                      ? 'bl'
                      : ''
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            const containerBuilder = new ContainerBuilder()
                .setAccentColor(
                    leaderboardChoice === Leaderboards.ScoreSaber
                        ? [255, 222, 24]
                        : leaderboardChoice === Leaderboards.BeatLeader
                          ? [217, 16, 65]
                          : undefined
                )
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(playerProfil.avatar)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### ${ldIcon ? `<:${ldIconName}:${ldIconId}>` : ''} ${hyperlink(playerProfil.name, playerProfil.url)}`
                            )
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `Le profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} a bien été lié avec le compte Discord de ${userMention(member.id)}`
                            )
                        )
                )

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [containerBuilder]
            })
        } catch (error) {
            if (
                error.name === 'COMMAND_INTERACTION_ERROR' ||
                error.name === 'SCORESABER_ERROR' ||
                error.name === 'BEATLEADER_ERROR' ||
                error.name === 'PLAYER_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
