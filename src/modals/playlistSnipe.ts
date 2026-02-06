import {
    ApplicationCommand,
    AttachmentBuilder,
    chatInputApplicationCommandMention,
    ContainerBuilder,
    FileBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    User,
    userMention
} from 'discord.js'
import { ModalError, ModalSubmissionError } from '../utils/error.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'
import players from '../controllers/players.js'
import playlist from '../controllers/playlist.js'

export default {
    /**
     * Soumission de la modale
     * @param interaction interaction Discord
     */
    async execute(interaction: ModalSubmitInteraction) {
        try {
            const applicationCommands =
                interaction.client.application.commands.cache

            const leaderboardNameSelectValues =
                interaction.fields.getStringSelectValues('leaderboard')
            const targetMemberSelectedUsers =
                interaction.fields.getSelectedUsers('player', true)

            const leaderboardName =
                leaderboardNameSelectValues[0] as Leaderboards
            const targetMember = targetMemberSelectedUsers.first() as User

            // Identifiant du membre exécutant la commande
            const memberId = interaction.user.id

            // Identifiant du membre à sniper
            const targetMemberId = targetMember.id

            // Informations sur les membres
            const member = await players.get(leaderboardName, memberId)

            // Informations sur les membres
            const memberToSnipe = await players.get(
                leaderboardName,
                targetMemberId
            )

            // On vérifie ici si les membres (celui exécutant la commande et celui à sniper) ont lié leur compte ScoreSaber ou BeatLeader
            const linkCommand = applicationCommands.find(
                (c) => c.name === 'link'
            ) as ApplicationCommand
            if (!member)
                throw new ModalSubmissionError(
                    `Aucun profil ${leaderboardName} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`
                )
            if (!memberToSnipe)
                throw new ModalSubmissionError(
                    `Aucun profil ${leaderboardName} n'est lié pour le compte Discord ${userMention(targetMemberId)}`
                )

            await interaction.deferReply({ flags: MessageFlags.Ephemeral })

            let containerBuilder = new ContainerBuilder()
                .setAccentColor([241, 196, 15])
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### 🛠️ Génération de la playlist en cours...'
                    )
                )

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [containerBuilder]
            })

            // Génération de la playlist
            const playlistData = await playlist.getSnipe(
                leaderboardName,
                member.playerId,
                memberToSnipe.playerId
            )

            const attachment = new AttachmentBuilder(
                Buffer.from(JSON.stringify(playlistData)),
                { name: `${playlistData.fileName}.json` }
            )

            containerBuilder = new ContainerBuilder()
                .setAccentColor(GameLeaderboard.getLdColor(leaderboardName))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### Ta playlist est prête !'
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(SeparatorSpacingSize.Large)
                )
                .addFileComponents(
                    new FileBuilder().setURL(`attachment://${attachment.name}`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                        .setDivider(false)
                        .setSpacing(SeparatorSpacingSize.Small)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# ${playlistData.songs.length} maps`
                    )
                )

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [containerBuilder],
                files: [attachment]
            })
        } catch (error) {
            if (
                error.name === 'MODAL_SUBMISSION_ERROR' ||
                error.name === 'PLAYER_ERROR' ||
                error.name === 'PLAYLIST_ERROR'
            ) {
                throw new ModalError(error.message, interaction.customId)
            } else {
                throw Error(error.message)
            }
        }
    }
}
