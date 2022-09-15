import { ApplicationCommandOptionType, CommandInteraction, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError, LeaderboardError, ScoreSaberError, BeatLeaderError } from '../utils/error.js'
import players from '../controllers/players.js'
import leaderboard from '../controllers/leaderboard.js'

export default {
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

            let player, memberId

            if(otherMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = otherMember.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!player) {
                    throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} n\'est lié pour le compte Discord ${userMention(memberId)}`)
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.member.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!player) {
                    const linkCommand = interaction.guild.commands.cache.find(c => c.name === 'link')
                    throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} n\'est lié avec votre compte Discord\nℹ️ Utilisez la commande </${linkCommand.name}:${linkCommand.id}> afin de lier celui-ci`)
                }
            }

            await interaction.deferReply()

            // Données de classement ScoreSaber du joueur
            const ld = rank ? await leaderboard.getGlobalLeaderboardByPlayerRank(leaderboardChoice, rank) : await leaderboard.getGlobalLeaderboardByPlayerId(leaderboardChoice, player.playerId)

            // On affiche le classement
            const embed = new Embed()
                .setColor('#000000')
                .setTitle(`Classement Mondial ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'}`)
                .setURL(`https://${leaderboardChoice === 'scoresaber' ? 'scoresaber.com/global' : 'beatleader.xyz/ranking'}`)
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