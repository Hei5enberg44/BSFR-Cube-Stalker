import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ApplicationCommand,
    chatInputApplicationCommandMention,
    userMention,
    bold,
    GuildMember,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    AttachmentBuilder,
    MediaGalleryItemBuilder,
    hyperlink,
    SeparatorBuilder,
    SeparatorSpacingSize
} from 'discord.js'
import roles from '../controllers/roles.js'
import players from '../controllers/players.js'
import cardgenerator from '../controllers/cardgenerator.js'
import {
    GameLeaderboard,
    Leaderboards
} from '../controllers/gameLeaderboard.js'
import { PlayerProgress } from '../interfaces/player.interface.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('me')
        .setDescription('Affiche vos informations de joueur')
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
                .setDescription("Affiche les informations d'un autre joueur")
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
            let leaderboardName = interaction.options.getString(
                'leaderboard'
            ) as Leaderboards | null
            const targetMember = interaction.options.getUser('joueur')

            const guild = interaction.client.guilds.cache.get(
                config.guild.id
            ) as Guild
            const applicationCommands =
                interaction.client.application.commands.cache

            await interaction.deferReply()

            let oldPlayerData, memberId

            if (targetMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = targetMember.id

                // Si le membre cible est le bot
                if (memberId === config.clientId)
                    throw new CommandInteractionError(
                        "Moi ? Je ne joue pas à ce vulgaire jeu. Je me contente d'afficher vos piètres scores, c'est déjà pas mal."
                    )

                // Anciennes données de classement du joueur
                oldPlayerData = leaderboardName
                    ? await players.get(leaderboardName, memberId)
                    : (await players.get(Leaderboards.ScoreSaber, memberId)) ||
                      (await players.get(Leaderboards.BeatLeader, memberId)) ||
                      (await players.get(Leaderboards.AccSaber, memberId))
                if (!leaderboardName && oldPlayerData)
                    leaderboardName =
                        oldPlayerData.leaderboard as Leaderboards

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if (!leaderboardName) {
                    throw new CommandInteractionError(
                        `Aucun profil ScoreSaber/BeatLeader/AccSaber n'est lié pour le compte Discord ${userMention(memberId)}`
                    )
                } else if (!oldPlayerData) {
                    throw new CommandInteractionError(
                        `Aucun profil ${leaderboardName} n'est lié pour le compte Discord ${userMention(memberId)}`
                    )
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.user.id

                // Anciennes données de classement du joueur
                oldPlayerData = leaderboardName
                    ? await players.get(leaderboardName, memberId)
                    : (await players.get(Leaderboards.ScoreSaber, memberId)) ||
                      (await players.get(Leaderboards.BeatLeader, memberId)) ||
                      (await players.get(Leaderboards.AccSaber, memberId))
                if (!leaderboardName && oldPlayerData)
                    leaderboardName =
                        oldPlayerData.leaderboard as Leaderboards

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                const linkCommand = applicationCommands.find(
                    (c) => c.name === 'link'
                ) as ApplicationCommand
                if (!leaderboardName) {
                    throw new CommandInteractionError(
                        `Aucun profil ScoreSaber/BeatLeader/AccSaber n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`
                    )
                } else if (!oldPlayerData) {
                    throw new CommandInteractionError(
                        `Aucun profil ${leaderboardName} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`
                    )
                }
            }

            // Nouvelles données de classement du joueur
            const gameLeaderboard = new GameLeaderboard(leaderboardName)
            const playerData = await gameLeaderboard.requests.getPlayerData(
                oldPlayerData.playerId
            )

            // Mise à jour des données de classement du joueur
            const newPlayerData = await players.update(
                memberId,
                leaderboardName,
                playerData
            )

            // Progressions du joueur
            const progressStatus = []
            let playerProgress: PlayerProgress = {
                rankDiff: newPlayerData.rank - oldPlayerData.rank,
                countryRankDiff:
                    newPlayerData.countryRank && oldPlayerData.countryRank
                        ? newPlayerData.countryRank - oldPlayerData.countryRank
                        : 0,
                pointsDiff: newPlayerData.points - oldPlayerData.points,
                accDiff: parseFloat(
                    (
                        parseFloat(
                            newPlayerData.averageRankedAccuracy.toFixed(2)
                        ) -
                        parseFloat(
                            oldPlayerData.averageRankedAccuracy.toFixed(2)
                        )
                    ).toFixed(2)
                ),
                serverPointsDiff:
                    newPlayerData.serverRankPoints -
                    oldPlayerData.serverRankPoints,
                serverAccDiff:
                    newPlayerData.serverRankAcc - oldPlayerData.serverRankAcc
            }

            // Rang global
            const rankDiff = Math.abs(playerProgress.rankDiff)
            if (newPlayerData.rank !== oldPlayerData.rank)
                progressStatus.push(
                    `${bold(`${newPlayerData.rank < oldPlayerData.rank ? '+' : '-'}${rankDiff} place${rankDiff > 1 ? 's' : ''}`)} dans le classement mondial`
                )

            // Rank pays
            const countryRankDiff = Math.abs(playerProgress.countryRankDiff)
            if (
                newPlayerData.countryRank &&
                oldPlayerData.countryRank &&
                playerData.country
            ) {
                if (newPlayerData.countryRank !== oldPlayerData.countryRank)
                    progressStatus.push(
                        `${bold(`${newPlayerData.countryRank < oldPlayerData.countryRank ? '+' : '-'}${countryRankDiff} place${countryRankDiff > 1 ? 's' : ''}`)} dans le classement ${countryCodeEmoji(playerData.country)}`
                    )
            }

            // Points
            const pointsDiff = new Intl.NumberFormat('en-US').format(
                Math.abs(playerProgress.pointsDiff)
            )
            if (newPlayerData.points !== oldPlayerData.points)
                progressStatus.push(
                    `${bold(`${newPlayerData.points > oldPlayerData.points ? '+' : '-'}${pointsDiff}${leaderboardName !== Leaderboards.AccSaber ? 'pp' : 'ap'}`)}`
                )

            // Acc
            const accDiff = Math.abs(playerProgress.accDiff)
            if (
                parseFloat(newPlayerData.averageRankedAccuracy.toFixed(2)) !==
                parseFloat(oldPlayerData.averageRankedAccuracy.toFixed(2))
            )
                progressStatus.push(
                    `${bold(`${newPlayerData.averageRankedAccuracy > oldPlayerData.averageRankedAccuracy ? '+' : '-'}${accDiff}%`)} de précision moyenne en classé`
                )

            // Rank Server Points
            const serverPointsDiff = Math.abs(playerProgress.serverPointsDiff)
            if (
                newPlayerData.serverRankPoints !==
                oldPlayerData.serverRankPoints
            )
                progressStatus.push(
                    `${bold(`${newPlayerData.serverRankPoints < oldPlayerData.serverRankPoints ? '+' : '-'}${serverPointsDiff} place${serverPointsDiff > 1 ? 's' : ''}`)} dans le classement des points de performance du serveur`
                )

            // Rank Server Acc
            const serverAccDiff = Math.abs(playerProgress.serverAccDiff)
            if (newPlayerData.serverRankAcc !== oldPlayerData.serverRankAcc)
                progressStatus.push(
                    `${bold(`${newPlayerData.serverRankAcc < oldPlayerData.serverRankAcc ? '+' : '-'}${serverAccDiff} place${serverAccDiff > 1 ? 's' : ''}`)} dans le classement de précision moyenne en classé du serveur`
                )

            // Nouveau top score ?
            let newTopScore = false
            if (
                oldPlayerData.topScore === null &&
                newPlayerData.topScore !== null
            ) {
                newTopScore = true
            } else if (
                oldPlayerData.topScore !== null &&
                newPlayerData.topScore !== null
            ) {
                if (
                    oldPlayerData.topScore.points !==
                    newPlayerData.topScore.points
                )
                    newTopScore = true
            }

            const meCommand = applicationCommands.find(
                (c) => c.name === 'me'
            ) as ApplicationCommand
            if (progressStatus.length === 0)
                progressStatus.push(
                    `Pas de progression depuis le dernier ${chatInputApplicationCommandMention(meCommand.name, meCommand.id)}`
                )

            // On met à jour les rôles du membre en fonction de son nombre de pp
            const memberToUpdate = (
                targetMember
                    ? guild.members.cache.find((m) => m.id === targetMember.id)
                    : guild.members.cache.find(
                          (m) => m.id === interaction.user.id
                      )
            ) as GuildMember
            if (leaderboardName !== Leaderboards.AccSaber) {
                await roles.updateMemberPpRoles(
                    leaderboardName,
                    memberToUpdate,
                    playerData.points
                )
            }

            // On affiche les informations du joueur
            const ldIconName = GameLeaderboard.getLdIconName(leaderboardName)
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            const containerComponent = new ContainerBuilder()
                .setAccentColor([241, 196, 15])
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `### 🛠️ Récupération du profil ${leaderboardName} en cours...`
                    )
                )

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [containerComponent]
            })

            const date = new Date()
            if (date.getDate() === 1 && date.getMonth() + 1 === 4) {
                const card = await cardgenerator.getStonkerCard(leaderboardName, playerData)

                await interaction.editReply({
                    files: [
                        { attachment: card.name, name: `${playerData.id}.webp` }
                    ],
                    embeds: []
                })

                card.removeCallback()
            } else {
                const card = await cardgenerator.getCard(
                    leaderboardName,
                    memberToUpdate,
                    playerData,
                    playerProgress
                )
                const attachment = new AttachmentBuilder(card.name, {
                    name: `${playerData.id}.webp`
                })
                let textContent = `### ${ldIcon ? `<:${ldIconName}:${ldIconId}> ` : ''} ${hyperlink(`Profil de ${playerData.name}`, playerData.url)}\n`
                textContent += progressStatus.map((p) => `- ${p}`).join('\n')

                const containerComponent = new ContainerBuilder()
                    .setAccentColor(
                        leaderboardName !== Leaderboards.AccSaber
                            ? (roles.getMemberPpRoleColor(
                                  leaderboardName,
                                  memberToUpdate
                              ) ?? memberToUpdate.displayColor)
                            : [10, 143, 237]
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(textContent)
                    )
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems([
                            new MediaGalleryItemBuilder().setURL(
                                `attachment://${attachment.name}`
                            )
                        ])
                    )

                if (newTopScore)
                    containerComponent
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(true)
                                .setSpacing(SeparatorSpacingSize.Large)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                bold(
                                    `🏆 Nouvelle Top ${leaderboardName !== Leaderboards.AccSaber ? 'PP' : 'AP'} LEZGONGUE !!`
                                )
                            )
                        )

                await interaction.editReply({
                    flags: [
                        MessageFlags.IsComponentsV2,
                        MessageFlags.SuppressEmbeds
                    ],
                    components: [containerComponent],
                    files: [attachment]
                })

                card.removeCallback()
            }
        } catch (error) {
            if (
                error.name === 'COMMAND_INTERACTION_ERROR' ||
                error.name === 'SCORESABER_ERROR' ||
                error.name === 'BEATLEADER_ERROR' ||
                error.name === 'ACCSABER_ERROR' ||
                error.name === 'LEADERBOARD_ERROR' ||
                error.name === 'PLAYER_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
