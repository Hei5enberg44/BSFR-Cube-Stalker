const { ApplicationCommandOptionType, CommandInteraction, userMention } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, CooldownError } = require('../utils/error')
const cooldown = require('../controllers/cooldown')
const players = require('../controllers/players')
const roles = require('../controllers/roles')

module.exports = {
    data: {
        name: 'unlink',
        description: 'Délie le profil ScoreSaber ou BeatLeader d\'un membre Discord',
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
                type: ApplicationCommandOptionType.User,
                name: 'joueur',
                description: 'Joueur à délier',
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
            const isAdmin = interaction.member.roles.cache.find(role => ["Admin", "Modérateur"].indexOf(role.name) !== -1) !== undefined

            const leaderboardChoice = interaction.options.getString('leaderboard')
            const member = interaction.options.getUser('joueur') ? interaction.options.getUser('joueur') : interaction.member

            // Si le membre n'a pas le rôle Admin ou Modérateur et essaye d'exécuter la commande sur un autre membre
            if(!isAdmin && member.id !== interaction.member.id) throw new CommandInteractionError('Vous n\'êtes pas autorisé à délier le profil ScoreSaber ou BeatLeader d\'un autre membre que vous')
            
            const memberToUnlink = await players.get(member.id, leaderboardChoice)
            if(!memberToUnlink) throw new CommandInteractionError(`Il n'y a pas de profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatSaber'} lié au membre ${userMention(member.id)}`)

            // Si le membre qui exécute la commande n'a pas le rôle Admin ou Modérateur, on lui ajoute un cooldown pour cette commande
            const cd = isAdmin ? null : await cooldown.checkCooldown(`unlink_${leaderboardChoice === 'scoresaber' ? 'ss' : 'bl'}`, interaction.member.id, 60 * 60 * 24 * 30)

            // On demande confirmation pour exécuter la commande
            let embedDesctiption = member.id === interaction.member.id ? `⚠️ Êtes-vous sûr(e) de vouloir délier votre profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatSaber'} ?` : `⚠️ Êtes-vous sûr(e) de vouloir délier le profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatSaber'} pour le membre ${userMention(member.id)} ?`
            if(cd) embedDesctiption += `\nVous pourrez exécuter cette commande de nouveau le \`${cd.date}\``
            
            let embed = new Embed()
                    .setColor('#2ECC71')
                    .setDescription(embedDesctiption)
            
            const confirmMessage = await interaction.reply({ embeds: [embed], fetchReply: true })

            await confirmMessage.react('✅')
            await confirmMessage.react('❎')

            const filter = (reaction, user) => ['✅', '❎'].includes(reaction.emoji.name) && user.id === interaction.user.id

            confirmMessage.awaitReactions({ filter, max: 1, time: 15000, errors: ['time'] })
                .then(async (collected) => {
                    const reaction = collected.first()

                    if(reaction.emoji.name === '✅') {
                        // On ajoute le cooldown si le membre exécutant la commande n'a pas le rôle Admin ou Modérateur
                        if(!isAdmin) await cooldown.addCooldown(`unlink_${leaderboardChoice === 'scoresaber' ? 'ss' : 'bl'}`, interaction.member.id, cd.timestamp)

                        // On délie le profil ScoreSaber ou BeatLeader du membre
                        await players.remove(member.id, leaderboardChoice)

                        // On supprime les rôles pp du membre
                        const memberToUpdate = interaction.guild.members.cache.find(m => m.id === member.id)
                        await roles.updateMemberPpRoles(memberToUpdate, 0)

                        await confirmMessage.reactions.removeAll()

                        embedDesctiption = `✅ Le profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatSaber'} a bien été délié du compte ${userMention(member.id)}`
                        if(cd) embedDesctiption += `\nVous pourrez exécuter cette commande de nouveau le \`${cd.date}\``

                        embed = new Embed()
                                .setColor('#2ECC71')
                                .setDescription(embedDesctiption)

                        await interaction.editReply({ embeds: [embed] })
                    } else if(reaction.emoji.name === '❎') {
                        await confirmMessage.reactions.removeAll()

                        embed = new Embed()
                                .setColor('#E74C3C')
                                .setDescription('❌ L\'opération a été annulée')

                        await interaction.editReply({ embeds: [embed] })
                    }
                }).catch(async (collected) => {
                    await confirmMessage.reactions.removeAll()

                    embed = new Embed()
                            .setColor('#E74C3C')
                            .setDescription('❌ Vous avez mis trop de temps à répondre')

                    await interaction.editReply({ embeds: [embed] })
                })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof CooldownError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}