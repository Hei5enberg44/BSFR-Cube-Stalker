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
import { CommandError, CommandInteractionError } from '../utils/error.js'
import roles from '../controllers/roles.js'
import players from '../controllers/players.js'
import cardgenerator from '../controllers/cardgenerator.js'
import {
    GameLeaderboard,
    Leaderboards
} from '../controllers/gameLeaderboard.js'
import { PlayerProgress } from '../interfaces/player.interface.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
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
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
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
            let leaderboardChoice = interaction.options.getString(
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
                oldPlayerData = leaderboardChoice
                    ? await players.get(memberId, leaderboardChoice)
                    : (await players.get(memberId, Leaderboards.ScoreSaber)) ||
                      (await players.get(memberId, Leaderboards.BeatLeader))
                if (!leaderboardChoice && oldPlayerData)
                    leaderboardChoice =
                        oldPlayerData.leaderboard as Leaderboards

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if (!leaderboardChoice) {
                    throw new CommandInteractionError(
                        `Aucun profil ScoreSaber ou BeatLeader n'est lié pour le compte Discord ${userMention(memberId)}`
                    )
                } else if (!oldPlayerData) {
                    throw new CommandInteractionError(
                        `Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié pour le compte Discord ${userMention(memberId)}`
                    )
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.user.id

                // Anciennes données de classement du joueur
                oldPlayerData = leaderboardChoice
                    ? await players.get(memberId, leaderboardChoice)
                    : (await players.get(memberId, Leaderboards.ScoreSaber)) ||
                      (await players.get(memberId, Leaderboards.BeatLeader))
                if (!leaderboardChoice && oldPlayerData)
                    leaderboardChoice =
                        oldPlayerData.leaderboard as Leaderboards

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                const linkCommand = applicationCommands.find(
                    (c) => c.name === 'link'
                ) as ApplicationCommand
                if (!leaderboardChoice) {
                    throw new CommandInteractionError(
                        `Aucun profil ScoreSaber ou BeatLeader n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`
                    )
                } else if (!oldPlayerData) {
                    throw new CommandInteractionError(
                        `Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`
                    )
                }
            }

            // Nouvelles données de classement du joueur
            const gameLeaderboard = new GameLeaderboard(leaderboardChoice)
            const playerData = await gameLeaderboard.requests.getPlayerData(
                oldPlayerData.playerId
            )

            // Mise à jour des données de classement du joueur
            const newPlayerData = await players.update(
                memberId,
                leaderboardChoice,
                playerData
            )

            // Progressions du joueur
            const progressStatus = []
            let playerProgress: PlayerProgress = {
                rankDiff: newPlayerData.rank - oldPlayerData.rank,
                countryRankDiff:
                    newPlayerData.countryRank - oldPlayerData.countryRank,
                ppDiff: newPlayerData.pp - oldPlayerData.pp,
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
                serverPPDiff:
                    newPlayerData.serverRankPP - oldPlayerData.serverRankPP,
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
            if (newPlayerData.countryRank !== oldPlayerData.countryRank)
                progressStatus.push(
                    `${bold(`${newPlayerData.countryRank < oldPlayerData.countryRank ? '+' : '-'}${countryRankDiff} place${countryRankDiff > 1 ? 's' : ''}`)} dans le classement ${countryCodeEmoji(playerData.country)}`
                )

            // PP
            const ppDiff = new Intl.NumberFormat('en-US').format(
                Math.abs(playerProgress.ppDiff)
            )
            if (newPlayerData.pp !== oldPlayerData.pp)
                progressStatus.push(
                    `${bold(`${newPlayerData.pp > oldPlayerData.pp ? '+' : '-'}${ppDiff}pp`)}`
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

            // Rank Server PP
            const serverPPDiff = Math.abs(playerProgress.serverPPDiff)
            if (newPlayerData.serverRankPP !== oldPlayerData.serverRankPP)
                progressStatus.push(
                    `${bold(`${newPlayerData.serverRankPP < oldPlayerData.serverRankPP ? '+' : '-'}${serverPPDiff} place${serverPPDiff > 1 ? 's' : ''}`)} dans le classement des points de performance du serveur`
                )

            // Rank Server Acc
            const serverAccDiff = Math.abs(playerProgress.serverAccDiff)
            if (newPlayerData.serverRankAcc !== oldPlayerData.serverRankAcc)
                progressStatus.push(
                    `${bold(`${newPlayerData.serverRankAcc < oldPlayerData.serverRankAcc ? '+' : '-'}${serverAccDiff} place${serverAccDiff > 1 ? 's' : ''}`)} dans le classement de précision moyenne en classé du serveur`
                )

            // Nouvelle top PP ?
            let newTopPP = false
            if (oldPlayerData.topPP === null && newPlayerData.topPP !== null) {
                newTopPP = true
            } else if (
                oldPlayerData.topPP !== null &&
                newPlayerData.topPP !== null
            ) {
                if (oldPlayerData.topPP.pp !== newPlayerData.topPP.pp)
                    newTopPP = true
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
            await roles.updateMemberPpRoles(
                leaderboardChoice,
                memberToUpdate,
                playerData.pp
            )

            // On affiche les informations du joueur
            const ldIconName =
                leaderboardChoice === Leaderboards.ScoreSaber
                    ? 'ss'
                    : leaderboardChoice === 'beatleader'
                      ? 'bl'
                      : ''
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            const containerComponent = new ContainerBuilder()
                .setAccentColor([241, 196, 15])
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `### 🛠️ Récupération du profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} en cours...`
                    )
                )

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [containerComponent]
            })

            const date = new Date()
            if (date.getDate() === 1 && date.getMonth() + 1 === 4) {
                const card = await cardgenerator.getStonkerCard(playerData)

                await interaction.editReply({
                    files: [
                        { attachment: card.name, name: `${playerData.id}.webp` }
                    ],
                    embeds: []
                })

                card.removeCallback()
            } else {
                const card = await cardgenerator.getCard(
                    leaderboardChoice,
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
                        roles.getMemberPpRoleColor(
                            leaderboardChoice,
                            memberToUpdate
                        ) ?? memberToUpdate.displayColor
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

                if (newTopPP)
                    containerComponent
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(true)
                                .setSpacing(SeparatorSpacingSize.Large)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                bold('🏆 Nouvelle Top PP LEZGONGUE !!')
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
