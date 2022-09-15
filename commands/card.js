import { ApplicationCommandOptionType, CommandInteraction, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError, ScoreSaberError, BeatLeaderError } from '../utils/error.js'
import players from '../controllers/players.js'
import cardgenerator from '../controllers/cardgenerator.js'

export default {
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

            await interaction.deferReply()

            let player, memberId

            if(otherMember) {
                // Identifiant du membre pour lequel aficher la carte
                memberId = otherMember.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!player) throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} n'est lié pour le compte Discord ${userMention(memberId)}`)
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.member.id
                
                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!player) {
                    const linkCommand = interaction.guild.commands.cache.find(c => c.name === 'link')
                    throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande </${linkCommand.name}:${linkCommand.id}> afin de lier celui-ci`)
                }
            }

            const embed = new Embed()
                .setColor('#F1C40F')
                .setDescription('🛠️ Fabrication de la carte en cours...')

            await interaction.editReply({ embeds: [embed] })

            const card = await cardgenerator.getCard(player.playerId, leaderboardChoice)

            await interaction.editReply({ files: [{attachment: card.name, name: player.playerId + '.png'}], embeds: [] })

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