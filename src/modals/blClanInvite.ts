import {
    ContainerBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    hyperlink
} from 'discord.js'
import { ModalError, ModalSubmissionError } from '../utils/error.js'
import {
    GameLeaderboard,
    Leaderboards
} from '../controllers/gameLeaderboard.js'
import { BeatLeaderOAuth } from '../controllers/beatleader-oauth.js'
import Logger from '../utils/logger.js'

export default {
    /**
     * Soumission de la modale
     * @param interaction interaction Discord
     */
    async execute(interaction: ModalSubmitInteraction) {
        try {
            const url = interaction.fields.getTextInputValue('url')

            if (!url.includes('beatleader'))
                throw new ModalSubmissionError(
                    `Le lien entré n\'est pas un lien BeatLeader valide`
                )

            await interaction.deferReply({ ephemeral: true })

            const gameLeaderboard = new GameLeaderboard(Leaderboards.BeatLeader)
            const playerProfil = await gameLeaderboard.requests.getProfile(url)

            await BeatLeaderOAuth.sendClanInvitation(playerProfil.id)
            Logger.log(
                'BeatLeaderOAuth',
                'INFO',
                `Une invitation à rejoindre le clan BSFR a été envoyée au joueur « ${playerProfil.name} »`
            )

            const containerComponent = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### ✅ Invitation envoyée !'
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${hyperlink('Cliquez ici', 'https://beatleader.xyz/clans')} pour accepter l'invitation.`
                    )
                )

            await interaction.editReply({
                flags: [
                    MessageFlags.IsComponentsV2,
                    MessageFlags.SuppressEmbeds
                ],
                components: [containerComponent]
            })
        } catch (error) {
            if (
                error.name === 'MODAL_SUBMISSION_ERROR' ||
                error.name === 'BEATLEADER_ERROR' ||
                error.name === 'PLAYER_ERROR'
            ) {
                throw new ModalError(error.message, interaction.customId)
            } else {
                throw Error(error.message)
            }
        }
    }
}
