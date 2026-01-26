import {
    AttachmentBuilder,
    ContainerBuilder,
    FileBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder
} from 'discord.js'
import { ModalError, ModalSubmissionError } from '../utils/error.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'
import playlist from '../controllers/playlist.js'

export default {
    /**
     * Soumission de la modale
     * @param interaction interaction Discord
     */
    async execute(interaction: ModalSubmitInteraction) {
        try {
            const leaderboardChoiceSelectValues =
                interaction.fields.getStringSelectValues('leaderboard')
            const minStarsSelectValues =
                interaction.fields.getStringSelectValues('min_stars')
            const maxStarsSelectValues =
                interaction.fields.getStringSelectValues('max_stars')

            const leaderboardChoice =
                leaderboardChoiceSelectValues[0] as Leaderboards
            const minStars =
                minStarsSelectValues.length === 0
                    ? 0
                    : parseInt(minStarsSelectValues[0])
            const maxStars =
                maxStarsSelectValues.length === 0
                    ? 99
                    : parseInt(maxStarsSelectValues[0])

            // On vérifie la cohérence des données renseignées par l'utilisateur
            if (minStars > maxStars)
                throw new ModalSubmissionError(
                    "Le nombre d'étoiles minimum ne peut pas être supérieur au nombre d'étoiles maximum"
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
            const playlistData = await playlist.getRanked(
                leaderboardChoice,
                minStars,
                maxStars
            )

            const attachment = new AttachmentBuilder(
                Buffer.from(JSON.stringify(playlistData)),
                { name: `${playlistData.fileName}.json` }
            )

            containerBuilder = new ContainerBuilder()
                .setAccentColor(GameLeaderboard.getLdColor(leaderboardChoice))
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
                error.name === 'PLAYLIST_ERROR'
            ) {
                throw new ModalError(error.message, interaction.customId)
            } else {
                throw Error(error.message)
            }
        }
    }
}
