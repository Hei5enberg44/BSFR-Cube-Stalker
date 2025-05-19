import {
    Guild,
    ModalSubmitInteraction,
    ApplicationCommand,
    chatInputApplicationCommandMention,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MessageFlags,
    hyperlink
} from 'discord.js'
import { ModalError, ModalSubmissionError } from '../utils/error.js'
import players from '../controllers/players.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'

export default {
    /**
     * Soumission de la modale
     * @param interaction interaction Discord
     */
    async execute(interaction: ModalSubmitInteraction) {
        try {
            const url = interaction.fields.getTextInputValue('url')

            const guild = <Guild>interaction.guild

            if(!url.includes('beatleader')) throw new ModalSubmissionError(`Le lien entré n\'est pas un lien BeatLeader valide`)

            const gameLeaderboard = new GameLeaderboard(Leaderboards.BeatLeader)
            const playerProfil = await gameLeaderboard.requests.getProfile(url)

            // Icône Leaderboard
            const ldIconName = 'bl'
            const ldIcon = guild.emojis.cache.find(e => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            // On ne lie pas le profil du joueur si celui-ci est banni du leaderboard
            if(playerProfil.banned) throw new ModalSubmissionError('Impossible de lier le profil de ce joueur car celui-ci est banni')

            await players.add(interaction.user.id, playerProfil.id, Leaderboards.BeatLeader)

            const meCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'me')

            const containerBuilder = new ContainerBuilder()
                .setAccentColor([ 46, 204, 113 ])
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(playerProfil.avatar)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`### ${ldIcon ? `<:${ldIconName}:${ldIconId}>` : ''} ${hyperlink(playerProfil.name, playerProfil.url)}`),
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('✅ Votre profil BeatLeader a bien été lié avec votre compte Discord'),
                            new TextDisplayBuilder().setContent(`ℹ️ Utilisez la commande ${chatInputApplicationCommandMention(meCommand.name, meCommand.id)} pour pouvoir être ajouté au classement du serveur`)
                        )
                )

            await interaction.reply({
                flags: [
                    MessageFlags.IsComponentsV2
                ],
                components: [ containerBuilder ]
            })
        } catch(error) {
            if(error.name === 'MODAL_SUBMISSION_ERROR' || error.name === 'BEATLEADER_ERROR' || error.name === 'PLAYER_ERROR') {
                throw new ModalError(error.message, interaction.customId)
            } else {
                throw Error(error.message)
            }
        }
    }
}