const { ApplicationCommandOptionType, CommandInteraction, userMention } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, ScoreSaberError, BeatLeaderError } = require('../utils/error')
const members = require('../controllers/members')
const cardgenerator = require('../controllers/cardgenerator')

module.exports = {
    data: {
        name: 'card',
        description: 'Génère votre carte de joueur',
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
                type: ApplicationCommandOptionType.User,
                name: 'joueur',
                description: 'Génère la carte d\'un autre membre',
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
            const otherMember = interaction.options.getUser('joueur')

            let member
            if(otherMember) {
                // Informations sur le membre
                member = await members.getMember(otherMember.id)

                if(!member) {
                    throw new CommandInteractionError(`Aucun profil ScoreSaber n\'est lié pour le compte Discord ${userMention(otherMember.id)}`)
                }
            } else {
                // Informations sur le membre
                member = await members.getMember(interaction.member.id)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou non
                if(!member) {
                    throw new CommandInteractionError('Aucun profil ScoreSaber n\'est lié avec votre compte Discord\nℹ️ Utilisez la commande `/link` afin de lier celui-ci')
                }
            }

            const embed = new Embed()
                .setColor('#F1C40F')
                .setDescription('🛠️ Fabrication de la carte en cours...')

            await interaction.reply({ embeds: [embed] })

            const card = await cardgenerator.getCard(leaderboardChoice, member.playerId)

            await interaction.editReply({ files: [{attachment: card.name, name: member.playerId + '.png'}], embeds: [] })

            card.removeCallback()
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError || error instanceof BeatLeaderError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}