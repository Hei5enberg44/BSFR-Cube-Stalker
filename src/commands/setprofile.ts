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
import players from '../controllers/players.js'
import {
    GameLeaderboard,
    Leaderboards
} from '../controllers/gameLeaderboard.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('setprofile')
        .setDescription(
            'Lie un compte ScoreSaber/BeatLeader/AccSaber à un compte Discord'
        )
        .addStringOption((option) =>
            option
                .setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: Leaderboards.ScoreSaber },
                    { name: 'BeatLeader', value: Leaderboards.BeatLeader },
                    { name: 'AccSaber', value: Leaderboards.AccSaber }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('url')
                .setDescription('Lien du profil ScoreSaber/BeatLeader/AccSaber')
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
            const leaderboardName = interaction.options.getString(
                'leaderboard',
                true
            ) as Leaderboards
            const url = interaction.options.getString('url', true)
            const member = interaction.options.getUser('joueur', true)

            const guild = interaction.client.guilds.cache.get(
                config.guild.id
            ) as Guild

            await interaction.deferReply()

            if (!url.includes(leaderboardName.toLowerCase()))
                throw new CommandInteractionError(
                    `Le lien entré n\'est pas un lien ${leaderboardName} valide`
                )

            const gameLeaderboard = new GameLeaderboard(leaderboardName)
            const playerData =
                await gameLeaderboard.requests.getPlayerDataByUrl(url)

            // On ne lie pas le profil du joueur si celui-ci est banni du leaderboard
            if (playerData.banned)
                throw new CommandInteractionError(
                    'Impossible de lier le profil de ce joueur car celui-ci est banni'
                )

            await players.add(member.id, playerData, leaderboardName, true)

            // Icône Leaderboard
            const ldIconName = GameLeaderboard.getLdIconName(leaderboardName)
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            const containerBuilder = new ContainerBuilder()
                .setAccentColor(GameLeaderboard.getLdColor(leaderboardName))
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(playerData.avatar)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### ${ldIcon ? `<:${ldIconName}:${ldIconId}>` : ''} ${hyperlink(playerData.name, playerData.url)}`
                            )
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `Le profil ${leaderboardName} a bien été lié avec le compte Discord de ${userMention(member.id)}`
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
                error.name === 'ACCSABER_ERROR' ||
                error.name === 'PLAYER_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
