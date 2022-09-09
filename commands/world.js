const { ApplicationCommandOptionType, CommandInteraction } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, LeaderboardError } = require('../utils/error')
const leaderboard = require('../controllers/leaderboard')

module.exports = {
    data: {
        name: 'world',
        description: 'Affiche le classement mondial',
        options: [
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
                name: 'nombre',
                description: 'Nombre de joueurs à afficher (10 par défaut, 20 maximum)',
                required: false
            }
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
            const count = interaction.options.getInteger('nombre') ?? 10

            if(count < 1 || count > 20) throw new CommandInteractionError('Le nombre de joueurs à afficher doit être compris entre 1 et 20')

            await interaction.deferReply()

            const ld = await leaderboard.getGlobalLeaderboard(leaderboardChoice, count)

            // On affiche le classement
            const embed = new Embed()
                .setColor('#000000')
                .setTitle(`Classement Mondial ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'}`)
                .setURL(`https://${leaderboardChoice === 'scoresaber' ? 'scoresaber.com/global' : 'beatleader.xyz/ranking'}`)
                .setDescription(ld)
            
            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof LeaderboardError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}