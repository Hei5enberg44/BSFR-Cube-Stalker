import { Guild, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ApplicationCommand, chatInputApplicationCommandMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import players from '../controllers/players.js'
import scoresaber from '../controllers/scoresaber.js'
import beatleader from '../controllers/beatleader.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Lie votre profil ScoreSaber ou BeatLeader à votre compte Discord')
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
            const leaderboardChoice = interaction.options.getString('leaderboard', true) as Leaderboards
            const url = interaction.options.getString('url', true)

            const guild = <Guild>interaction.guild

            await interaction.deferReply()

            let playerProfil
            
            if(leaderboardChoice === Leaderboards.ScoreSaber) {
                if(!url.includes('scoresaber')) throw new CommandInteractionError('Le lien entré n\'est pas un lien ScoreSaber valide')
                playerProfil = await scoresaber.getProfile(url)
            } else {
                if(!url.includes('beatleader')) throw new CommandInteractionError('Le lien entré n\'est pas un lien BeatLeader valide')
                playerProfil = await beatleader.getProfile(url)
            }

            // On ne lie pas le profil du joueur si celui-ci est banni du leaderboard
            if(playerProfil.banned) throw new CommandInteractionError('Impossible de lier le profil de ce joueur car celui-ci est banni')

            await players.add(interaction.user.id, playerProfil.id, leaderboardChoice)

            const meCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'me')
            
            const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle(playerProfil.name)
                    .setURL(playerProfil.url)
                    .setThumbnail(playerProfil.avatar)
                    .setDescription(`Votre profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} a bien été lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(meCommand.name, meCommand.id)} pour pouvoir être ajouté au classement du serveur`)

            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'SCORESABER_ERROR' || error.name === 'BEATLEADER_ERROR' || error.name === 'PLAYER_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}