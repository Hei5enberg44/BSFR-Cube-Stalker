import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import leaderboard from '../controllers/leaderboard.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('ld')
        .setDescription('Affiche le classement du serveur')
        .addStringOption(option =>
            option.setName('classement')
                .setDescription('Type de classement à afficher')
                .setChoices(
                    { name: 'Points de performance', value: 'pp' },
                    { name: 'Précision', value: 'acc' }
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
                )
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page à afficher')
                .setRequired(false)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    ,
    allowedChannels: [
        config.guild.channels['cube-stalker']
    ],

    /**
     * Exécution de la commande
     * @param interaction intéraction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const leaderboardChoice = interaction.options.getString('leaderboard') as Leaderboards ?? Leaderboards.ScoreSaber
            const classement = interaction.options.getString('classement', true)
            const page = interaction.options.getInteger('page') ?? 1

            if(page < 1) throw new CommandInteractionError('Le numéro de page doit être supérieur ou égal à 1')

            await interaction.deferReply()

            const ld = await leaderboard.getLeaderboard(leaderboardChoice, classement, page)

            // On affiche le classement
            const embed = new Embed()
                .setColor('#000000')
                .setTitle(ld.title)
                .setDescription(ld.content)
            
            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'SCORESABER_ERROR' || error.name === 'BEATLEADER_ERROR' || error.name === 'LEADERBOARD_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}