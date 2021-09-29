const { MessageEmbed } = require('discord.js')
const { CommandError, CommandInteractionError, CooldownError } = require('../utils/error')
const cooldown = require('../controllers/cooldown')
const members = require('../controllers/members')
const roles = require('../controllers/roles')
const config = require('../config.json')

module.exports = {
    data: {
        name: 'unlink',
        description: 'Délie le profil ScoreSaber d\'un membre Discord',
        options: [
            {
                type: 'USER',
                name: 'joueur',
                description: 'Joueur à délier',
                required: false
            }
        ]
    },
	async execute(interaction) {
        try {
            // On vérifie que la commande est exécutée dans le bon channel
            const cubeStalkerChannelId = config.guild.channels.cubeStalker.id
            if(interaction.channelId != cubeStalkerChannelId)
                throw new CommandInteractionError(`Merci d\'effectuer la commande dans <#${cubeStalkerChannelId}>`)
            
            const isAdmin = interaction.member.roles.cache.find(role => ["Admin", "Modérateur"].indexOf(role.name) !== -1) !== undefined

            const member = interaction.options.getUser('joueur') ? interaction.options.getUser('joueur') : interaction.member

            // Si le membre n'a pas le rôle Admin ou Modérateur et essaye d'exécuter la commande sur un autre membre
            if(!isAdmin && member.id !== interaction.member.id) throw new CommandInteractionError('Vous n\'êtes pas autorisé à délier le profil ScoreSaber d\'un autre membre que vous')
            
            const memberToUnlink = await members.getMember(member.id)
            if(!memberToUnlink) throw new CommandInteractionError(`Il n'y a pas de profil ScoreSaber lié au membre <@${member.id}>`)

            // Si le membre qui exécute la commande n'a pas le rôle Admin ou Modérateur, on lui ajoute un cooldown pour cette commande
            const cd = isAdmin ? null : await cooldown.checkCooldown('unlink', interaction.member.id, 60 * 60 * 24 * 30)

            // On demande confirmation pour exécuter la commande
            let embedDesctiption = member.id === interaction.member.id ? ':warning: Êtes-vous sûr(e) de vouloir délier votre profil ScoreSaber ?' : `:warning: Êtes-vous sûr(e) de vouloir délier le profil ScoreSaber pour le membre <@${member.id}> ?`
            if(cd) embedDesctiption += `\nVous pourrez exécuter cette commande de nouveau le \`${cd.date}\``
            
            let embed = new MessageEmbed()
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
                        if(!isAdmin) await cooldown.addCooldown('unlink', interaction.member.id, cd.timestamp)

                        // On délie le profil ScoreSaber du membre
                        await members.delMember(member.id)

                        // On supprime les rôles pp du membre
                        const memberToUpdate = interaction.guild.members.cache.find(m => m.id === member.id)
                        await roles.updateMemberPpRoles(memberToUpdate, 0)

                        await confirmMessage.reactions.removeAll()

                        embedDesctiption = `:white_check_mark: Le profil ScoreSaber a bien été délié du compte <@${member.id}>`
                        if(cd) embedDesctiption += `\nVous pourrez exécuter cette commande de nouveau le \`${cd.date}\``

                        embed = new MessageEmbed()
                                .setColor('#2ECC71')
                                .setDescription(embedDesctiption)

                        await interaction.editReply({ embeds: [embed] })
                    } else if(reaction.emoji.name === '❎') {
                        await confirmMessage.reactions.removeAll()

                        embed = new MessageEmbed()
                                .setColor('#E74C3C')
                                .setDescription(':x: L\'opération a été annulée')

                        await interaction.editReply({ embeds: [embed] })
                    }
                }).catch(async (collected) => {
                    await confirmMessage.reactions.removeAll()

                    embed = new MessageEmbed()
                            .setColor('#E74C3C')
                            .setDescription(':x: Vous avez mis trop de temps à répondre')

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