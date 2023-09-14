import { Guild, SlashCommandBuilder, ChatInputCommandInteraction, ApplicationCommand, inlineCode, userMention, chatInputApplicationCommandMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import players from '../controllers/players.js'
import leaderboard from '../controllers/leaderboard.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('locateworld')
        .setDescription('Affiche votre position dans le classement mondial')
        .addStringOption(option =>
            option.setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
                )
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('joueur')
                .setDescription('Affiche la position d\'un autre membre')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('rang')
                .setDescription('Affiche la position d\'un joueur par rapport à son rang')
                .setRequired(false)
        )
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
            const targetMember = interaction.options.getUser('joueur')
            const rank = interaction.options.getInteger('rang')

            const guild = <Guild>interaction.guild

            // On vérifie que les 2 arguments n'ont pas été passés en même temps
            if(targetMember && rank) throw new CommandInteractionError(`Vous ne pouvez pas combiner les options ${inlineCode('joueur')} et ${inlineCode('rang')}`)

            if(rank && rank < 1) throw new CommandInteractionError('Le rang du joueur doit être supérieur ou égal à 1')

            let player, memberId

            if(targetMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = targetMember.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!player) {
                    throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié pour le compte Discord ${userMention(memberId)}`)
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.user.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!player) {
                    const linkCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'link')
                    throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`)
                }
            }

            await interaction.deferReply()

            // Données de classement ScoreSaber du joueur
            const ld = rank ? await leaderboard.getGlobalLeaderboardByPlayerRank(leaderboardChoice, rank) : await leaderboard.getGlobalLeaderboardByPlayerId(leaderboardChoice, player.playerId)

            // On affiche le classement
            const embed = new Embed()
                .setColor('#000000')
                .setTitle(`Classement Mondial ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}`)
                .setURL(`https://${leaderboardChoice === Leaderboards.ScoreSaber ? 'scoresaber.com/global' : 'beatleader.xyz/ranking'}`)
                .setDescription(ld)
            
            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'LEADERBOARD_ERROR' || error.name === 'SCORESABER_ERROR' || error.name === 'BEATLEADER_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
        
    }
}