import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import players from '../controllers/players.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('setprofile')
        .setDescription('Lie un compte ScoreSaber ou BeatLeader à un compte Discord')
        .addStringOption(option =>
            option.setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Lien du profil ScoreSaber ou BeatLeader')
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('joueur')
                .setDescription('Joueur à lier')
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
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
            const leaderboardChoice = interaction.options.getString('leaderboard', true) as Leaderboards
            const url = interaction.options.getString('url', true)
            const member = interaction.options.getUser('joueur', true)

            await interaction.deferReply()

            if(!url.includes(leaderboardChoice)) throw new CommandInteractionError(`Le lien entré n\'est pas un lien ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} valide`)

            const gameLeaderboard = new GameLeaderboard(leaderboardChoice)
            const playerProfil = await gameLeaderboard.requests.getProfile(url)

            // On ne lie pas le profil du joueur si celui-ci est banni du leaderboard
            if(playerProfil.banned) throw new CommandInteractionError('Impossible de lier le profil de ce joueur car celui-ci est banni')

            await players.add(member.id, playerProfil.id, leaderboardChoice, true)
            
            const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle(playerProfil.name)
                    .setURL(playerProfil.url)
                    .setThumbnail(playerProfil.avatar)
                    .setDescription(`Le profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} a bien été lié avec le compte Discord de ${userMention(member.id)}`)

            await interaction.editReply({ embeds: [embed] })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'SCORESABER_ERROR' || error.name === 'BEATLEADER_ERROR' || error.name === 'PLAYER_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}