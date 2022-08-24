const { ApplicationCommandOptionType } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, MemberError, ScoreSaberError, BeatLeaderError } = require('../utils/error')
const members = require('../controllers/members')
const scoresaber = require('../controllers/scoresaber')
const beatleader = require('../controllers/beatleader')

module.exports = {
    data: {
        name: 'link',
        description: 'Lie votre profil ScoreSaber ou BeatLeader à votre compte Discord',
        options: [
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
            const url = interaction.options.getString('lien_leaderboard')

            await interaction.deferReply()

            let playerProfil
            if(url.includes('scoresaber')) {
                playerProfil = await scoresaber.getProfile(url)
            } else if(url.includes('beatleader')) {
                playerProfil = await beatleader.getProfile(url)
            } else {
                throw new CommandInteractionError('Le lien entré n\'est pas un lien ScoreSaber ou BeatLeader valide')
            }

            await members.addMember(interaction.member.id, playerProfil.id)
            
            const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle(playerProfil.name)
                    .setURL(playerProfil.url)
                    .setThumbnail(playerProfil.avatar)
                    .setDescription('Votre profil ScoreSaber/BeatLeader a bien été lié avec votre compte Discord\nTapez la commande `/me` pour pouvoir être ajouté au classement du serveur')

            await interaction.editReply({ embeds: [ embed ] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError|| error instanceof BeatLeaderError || error instanceof MemberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}