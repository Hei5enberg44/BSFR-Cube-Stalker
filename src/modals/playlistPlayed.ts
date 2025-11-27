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
    TextDisplayBuilder
} from 'discord.js'
import { ModalError, ModalSubmissionError } from '../utils/error.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
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

            const leaderboardChoiceSelectValues =
                interaction.fields.getStringSelectValues('leaderboard')
            const minStarsSelectValues =
                interaction.fields.getStringSelectValues('min_stars')
            const maxStarsSelectValues =
                interaction.fields.getStringSelectValues('max_stars')
            const minAccTextInputValue =
                interaction.fields.getTextInputValue('min_acc')
            const maxAccTextInputValue =
                interaction.fields.getTextInputValue('max_acc')

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
            const minAcc =
                minAccTextInputValue.length === 0
                    ? 0
                    : Number(minAccTextInputValue)
            const maxAcc =
                minAccTextInputValue.length === 0
                    ? 100
                    : Number(maxAccTextInputValue)

            // On vérifie la cohérence des données renseignées par l'utilisateur
            if (minStars > maxStars)
                throw new ModalSubmissionError(
                    "Le nombre d'étoiles minimum ne peut pas être supérieur au nombre d'étoiles maximum"
                )
            if (isNaN(minAcc))
                throw new ModalSubmissionError(
                    "Valeur d'accuracy minimum incorrecte."
                )
            if (isNaN(maxAcc))
                throw new ModalSubmissionError(
                    "Valeur d'accuracy maximum incorrecte."
                )
            if (minAcc > maxAcc)
                throw new ModalSubmissionError(
                    "L'accuracy minimum ne peut pas être supérieur à l'accuracy maximum"
                )

            // Informations sur le joueur
            const member = await players.get(
                interaction.user.id,
                leaderboardChoice
            )

            // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
            const linkCommand = applicationCommands.find(
                (c) => c.name === 'link'
            ) as ApplicationCommand
            if (!member)
                throw new ModalSubmissionError(
                    `Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`
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
            const playlistData = await playlist.getPlayed(
                leaderboardChoice,
                member.playerId,
                minStars,
                maxStars,
                parseFloat(minAcc.toFixed(2)),
                parseFloat(maxAcc.toFixed(2))
            )

            const attachment = new AttachmentBuilder(
                Buffer.from(JSON.stringify(playlistData)),
                { name: `${playlistData.fileName}.json` }
            )

            containerBuilder = new ContainerBuilder()
                .setAccentColor(
                    leaderboardChoice === Leaderboards.ScoreSaber
                        ? [255, 222, 24]
                        : leaderboardChoice === Leaderboards.BeatLeader
                          ? [217, 16, 65]
                          : undefined
                )
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
