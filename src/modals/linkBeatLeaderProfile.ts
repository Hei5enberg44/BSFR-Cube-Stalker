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
import {
    GameLeaderboard,
    Leaderboards
} from '../controllers/gameLeaderboard.js'
import config from '../../config.json' with { type: 'json' }

export default {
    /**
     * Soumission de la modale
     * @param interaction interaction Discord
     */
    async execute(interaction: ModalSubmitInteraction) {
        try {
            const url = interaction.fields.getTextInputValue('url')

            const guild = interaction.client.guilds.cache.get(
                config.guild.id
            ) as Guild
            const applicationCommands =
                interaction.client.application.commands.cache

            if (!url.includes('beatleader'))
                throw new ModalSubmissionError(
                    `Le lien entré n\'est pas un lien BeatLeader valide`
                )

            const gameLeaderboard = new GameLeaderboard(Leaderboards.BeatLeader)
            const playerData =
                await gameLeaderboard.requests.getPlayerDataByUrl(url)

            // Icône Leaderboard
            const ldIconName = 'bl'
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            // On ne lie pas le profil du joueur si celui-ci est banni du leaderboard
            if (playerData.banned)
                throw new ModalSubmissionError(
                    'Impossible de lier le profil de ce joueur car celui-ci est banni'
                )

            await players.add(
                interaction.user.id,
                playerData,
                Leaderboards.BeatLeader
            )

            const meCommand = applicationCommands.find(
                (c) => c.name === 'me'
            ) as ApplicationCommand

            const containerBuilder = new ContainerBuilder()
                .setAccentColor([46, 204, 113])
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(playerData.avatar)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### ${ldIcon ? `<:${ldIconName}:${ldIconId}>` : ''} ${hyperlink(playerData.name, playerData.url)}\n` +
                                    '✅ Votre profil BeatLeader a bien été lié avec votre compte Discord\n' +
                                    '👏 Vous avez été ajouté au classement du serveur !\n' +
                                    `ℹ️ Vous pouvez maintenant tiliser la commande ${chatInputApplicationCommandMention(meCommand.name, meCommand.id)} pour voir votre profil`
                            )
                        )
                )

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2],
                components: [containerBuilder]
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
