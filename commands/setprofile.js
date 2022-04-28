const { userMention } = require('@discordjs/builders')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, MemberError, ScoreSaberError } = require('../utils/error')
const members = require('../controllers/members')
const scoresaber = require('../controllers/scoresaber')

module.exports = {
    data: {
        name: 'setprofile',
        description: 'Lie un compte ScoreSaber ou BeatLeader à un compte Discord',
        options: [
            {
                type: 'STRING',
                name: 'lien_leaderboard',
                description: 'Lien du profil ScoreSaber ou BeatLeader',
                required: true
            },
            {
                type: 'USER',
                name: 'joueur',
                description: 'Joueur à lier',
                required: true
            }
        ],
        default_member_permissions: '0'
    },
    roles: [ 'Admin', 'Modérateur' ],
    channels: [ 'cubeStalker' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const url = interaction.options.getString('lien_leaderboard')
            const member = interaction.options.getUser('joueur')

            await interaction.deferReply()

            let playerProfil
            if(url.includes('scoresaber')) {
                playerProfil = await scoresaber.getProfile(url)
            } else if(url.includes('beatleader')) {
                playerProfil = await beatleader.getProfile(url)
            } else {
                throw new CommandInteractionError('Le lien entré n\'est pas un lien ScoreSaber ou BeatLeader valide')
            }

            await members.addMember(member.id, playerProfil.id, true)
            
            const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle(playerProfil.name)
                    .setURL(playerProfil.url)
                    .setThumbnail(playerProfil.avatar)
                    .setDescription(`Le profil ScoreSaber/BeatLeader a bien été lié avec le compte Discord de ${userMention(member.id)}`)

            await interaction.editReply({ embeds: [embed] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError || error instanceof MemberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}