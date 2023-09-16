import { Guild, ModalSubmitInteraction, ApplicationCommand, chatInputApplicationCommandMention } from 'discord.js'
import Embed from '../utils/embed.js'
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

            if(!url.includes('scoresaber')) throw new ModalSubmissionError(`Le lien entré n\'est pas un lien ScoreSaber valide`)

            const gameLeaderboard = new GameLeaderboard(Leaderboards.ScoreSaber)
            const playerProfil = await gameLeaderboard.requests.getProfile(url)

            // On ne lie pas le profil du joueur si celui-ci est banni du leaderboard
            if(playerProfil.banned) throw new ModalSubmissionError('Impossible de lier le profil de ce joueur car celui-ci est banni')

            await players.add(interaction.user.id, playerProfil.id, Leaderboards.ScoreSaber)

            const meCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'me')
            
            const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle(playerProfil.name)
                    .setURL(playerProfil.url)
                    .setThumbnail(playerProfil.avatar)
                    .setDescription(`Votre profil ScoreSaber a bien été lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(meCommand.name, meCommand.id)} pour pouvoir être ajouté au classement du serveur`)

            await interaction.reply({ embeds: [ embed ] })
        } catch(error) {
            if(error.name === 'MODAL_SUBMISSION_ERROR' || error.name === 'SCORESABER_ERROR' || error.name === 'PLAYER_ERROR') {
                throw new ModalError(error.message, interaction.customId)
            } else {
                throw Error(error.message)
            }
        }
    }
}