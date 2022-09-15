import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError, LeaderboardError, ScoreSaberError, BeatLeaderError } from '../utils/error.js'
import leaderboard from '../controllers/leaderboard.js'

export default {
    data: {
        name: 'ld',
        description: 'Affiche le classement du serveur',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'classement',
                description: 'Type de classement à afficher',
                choices: [
                    {
                        name: 'Points de performance',
                        value: 'pp'
                    },
                    {
                        name: 'Précision',
                        value: 'acc'
                    }
                ],
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'leaderboard',
                description: 'Choix du leaderboard',
                choices: [
                    {
                        name: 'ScoreSaber',
                        value: 'scoresaber'
                    },
                    {
                        name: 'BeatLeader',
                        value: 'beatleader'
                    }
                ],
                required: false
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'page',
                description: 'Page à afficher',
                required: false
            },
        ],
        default_member_permissions: '0'
    },
    channels: [ 'cubeStalker' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const leaderboardChoice = interaction.options.getString('leaderboard') ?? 'scoresaber'
            const type = interaction.options.getString('classement')
            const page = interaction.options.getInteger('page') ?? 1

            if(page < 1) throw new CommandInteractionError('Le numéro de page doit être supérieur ou égal à 1')

            await interaction.deferReply()

            const ld = await leaderboard.getLeaderboard(leaderboardChoice, type, page)

            // On affiche le classement
            const embed = new Embed()
                .setColor('#000000')
                .setTitle(ld.title)
                .setDescription(ld.content)
            
            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError || error instanceof BeatLeaderError || error instanceof LeaderboardError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}