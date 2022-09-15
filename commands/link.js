import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError, PlayerError, ScoreSaberError, BeatLeaderError } from '../utils/error.js'
import players from '../controllers/players.js'
import scoresaber from '../controllers/scoresaber.js'
import beatleader from '../controllers/beatleader.js'

export default {
    data: {
        name: 'link',
        description: 'Lie votre profil ScoreSaber ou BeatLeader à votre compte Discord',
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
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'lien_leaderboard',
                description: 'Lien du profil ScoreSaber ou BeatLeader',
                required: true
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
            const leaderboardChoice = interaction.options.getString('leaderboard')
            const url = interaction.options.getString('lien_leaderboard')

            await interaction.deferReply()

            let playerProfil
            
            if(leaderboardChoice === 'scoresaber') {
                if(!url.includes('scoresaber')) throw new CommandInteractionError('Le lien entré n\'est pas un lien ScoreSaber valide')
                playerProfil = await scoresaber.getProfile(url)
            } else {
                if(!url.includes('beatleader')) throw new CommandInteractionError('Le lien entré n\'est pas un lien BeatLeader valide')
                playerProfil = await beatleader.getProfile(url)
            }

            // On ne lie pas le profil du joueur si celui-ci est banni du leaderboard
            if(playerProfil.banned) throw new CommandInteractionError('Impossible de lier le profil de ce joueur car celui-ci est banni')

            await players.add(interaction.member.id, playerProfil.id, leaderboardChoice)

            const meCommand = interaction.guild.commands.cache.find(c => c.name === 'me')
            
            const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle(playerProfil.name)
                    .setURL(playerProfil.url)
                    .setThumbnail(playerProfil.avatar)
                    .setDescription(`Votre profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} a bien été lié avec votre compte Discord\nℹ️ Utilisez la commande </${meCommand.name}:${meCommand.id}> pour pouvoir être ajouté au classement du serveur`)

            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError|| error instanceof BeatLeaderError || error instanceof PlayerError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}