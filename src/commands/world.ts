import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import leaderboard from '../controllers/leaderboard.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('world')
        .setDescription('Affiche le classement mondial')
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
            option.setName('nombre')
                .setDescription('Nombre de joueurs à afficher (10 par défaut, 20 maximum)')
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
            const count = interaction.options.getInteger('nombre') ?? 10

            if(count < 1 || count > 20) throw new CommandInteractionError('Le nombre de joueurs à afficher doit être compris entre 1 et 20')

            await interaction.deferReply()

            const ld = await leaderboard.getGlobalLeaderboard(leaderboardChoice, count)

            // On affiche le classement
            const embed = new Embed()
                .setColor('#000000')
                .setTitle(`Classement Mondial ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}`)
                .setURL(`https://${leaderboardChoice === Leaderboards.ScoreSaber ? 'scoresaber.com/global' : 'beatleader.xyz/ranking'}`)
                .setDescription(ld)
            
            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'LEADERBOARD_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}