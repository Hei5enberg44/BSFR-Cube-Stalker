const { ApplicationCommandOptionType, userMention } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, LeaderboardError, ScoreSaberError, BeatLeaderError } = require('../utils/error')
const members = require('../controllers/members')
const leaderboard = require('../controllers/leaderboard')

module.exports = {
    data: {
        name: 'locateworld',
        description: 'Affiche votre position dans le classement mondial',
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
                description: 'Affiche la position d\'un autre membre',
                required: false
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'rang',
                description: 'Affiche la position d\'un joueur par rapport à son rang',
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
            const rank = interaction.options.getInteger('rang')

            // On vérifie que les 2 arguments n'ont pas été passés en même temps
            if(otherMember && rank) throw new CommandInteractionError('Vous ne pouvez pas combiner les 2 arguments')

            if(rank && rank < 1) throw new CommandInteractionError('Le rang du joueur doit être supérieur ou égal à 1')

            let member

            if(otherMember) {
                // Informations sur le membre
                member = await members.getMember(otherMember.id)

                // On vérifie ici si le membre a lié son compte ScoreSaber/BeatLeader ou non
                if(!member) {
                    throw new CommandInteractionError(`Aucun profil ScoreSaber/BeatLeader n\'est lié pour le compte Discord ${userMention(otherMember.id)}`)
                }
            } else {
                // Informations sur le membre
                member = await members.getMember(interaction.member.id)

                // On vérifie ici si le membre a lié son compte ScoreSaber/BeatLeader ou non
                if(!member) {
                    throw new CommandInteractionError('Aucun profil ScoreSaber/BeatLeader n\'est lié avec votre compte Discord\nℹ️ Utilisez la commande `/link` afin de lier celui-ci')
                }
            }

            await interaction.deferReply()

            // Données de classement ScoreSaber du joueur
            const ld = rank ? await leaderboard.getGlobalLeaderboardByPlayerRank(leaderboardChoice, rank) : await leaderboard.getGlobalLeaderboardByPlayerId(leaderboardChoice, member.playerId)

            // On affiche le classement
            const embed = new Embed()
                .setColor('#000000')
                .setTitle('Classement Mondial')
                .setURL('https://scoresaber.com/global')
                .setDescription(ld)
            
            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof LeaderboardError || error instanceof ScoreSaberError || error instanceof BeatLeaderError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
        
	}
}