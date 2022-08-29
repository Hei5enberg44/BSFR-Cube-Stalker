const { CommandInteraction, inlineCode } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')

module.exports = {
    data: {
        name: 'help',
        description: 'Affiche l\'aide',
        default_member_permissions: '0'
    },
    channels: [ 'cubeStalker' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const commandsList = [
                { name: 'link', description: 'Lie votre profil ScoreSaber/BeatLeader à votre compte Discord' },
                { name: 'unlink', description: 'Supprime la liaison de votre profil ScoreSaber/BeatLeader à votre compte Discord' },
                { name: 'me', description: 'Affiche vos informations de joueur ou celles d\'un autre joueur' },
                { name: 'card', description: 'Génère votre carte de joueur ou celle d\'un autre joueur' },
                { name: 'ld', description: 'Affiche le classement du serveur (pp ou acc)' },
                { name: 'locateworld', description: 'Affiche votre position ou celle d\'un autre joueur dans le classement mondial' },
                { name: 'top1', description: 'S\'inscire ou se désinscrire du top 1 FR' },
                { name: 'world', description: 'Affiche le classement mondial' },
                { name: 'playlist', description: 'Génère une playlist en fonction de vos maps jouées et de vos critères choisis en options de commande' },
            ]

            const help = commandsList.map(cl => {
                const command = interaction.guild.commands.cache.find(c => c.name === cl.name)
                return `</${command.name}:${command.id}>: ${cl.description}`
            }).join('\n')

            const embed = new Embed()
                .setColor('#000000')
                .setTitle('Aide')
                .addFields({ name: 'Liste des commandes', value: help})
            
            await interaction.reply({ embeds: [ embed ], ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof Top1Error) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}

///////////////////////////////////////
// Mentions des commandes dans l'aide