import { Guild, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, MessageReaction, time, TimestampStyles, User, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import cooldown from '../controllers/cooldown.js'
import players from '../controllers/players.js'
import roles from '../controllers/roles.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Délie le profil ScoreSaber ou BeatLeader d\'un membre Discord')
        .addStringOption(option =>
            option.setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
                )
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('joueur')
                .setDescription('Joueur à délier')
                .setRequired(false)
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
            const memberRoles = (<GuildMemberRoleManager>interaction.member?.roles).cache
            const isAdmin = memberRoles.find(role => ['Admin', 'Modérateur'].indexOf(role.name) !== -1) !== undefined

            const leaderboardChoice = interaction.options.getString('leaderboard') as Leaderboards
            const member = interaction.options.getUser('joueur') ?? interaction.user

            const guild = <Guild>interaction.guild

            // Si le membre n'a pas le rôle Admin ou Modérateur et essaye d'exécuter la commande sur un autre membre
            if(!isAdmin && member.id !== interaction.user.id) throw new CommandInteractionError('Vous n\'êtes pas autorisé à délier le profil ScoreSaber ou BeatLeader d\'un autre membre que vous')
            
            const memberToUnlink = await players.get(member.id, leaderboardChoice)
            if(!memberToUnlink) throw new CommandInteractionError(`Il n'y a pas de profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatSaber'} lié au membre ${userMention(member.id)}`)

            // Si le membre qui exécute la commande n'a pas le rôle Admin ou Modérateur, on lui ajoute un cooldown pour cette commande
            const cd = isAdmin ? null : await cooldown.checkCooldown(`unlink_${leaderboardChoice === Leaderboards.ScoreSaber ? 'ss' : 'bl'}`, interaction.user.id, 60 * 60 * 24 * 30)

            // On demande confirmation pour exécuter la commande
            let embedDesctiption = member.id === interaction.user.id ? `⚠️ Êtes-vous sûr(e) de vouloir délier votre profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatSaber'} ?` : `⚠️ Êtes-vous sûr(e) de vouloir délier le profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatSaber'} pour le membre ${userMention(member.id)} ?`
            if(cd) embedDesctiption += `\nVous pourrez exécuter cette commande de nouveau \`${time(cd, TimestampStyles.RelativeTime)}\``
            
            let embed = new Embed()
                    .setColor('#2ECC71')
                    .setDescription(embedDesctiption)
            
            const confirmMessage = await interaction.reply({ embeds: [embed], fetchReply: true })

            await confirmMessage.react('✅')
            await confirmMessage.react('❎')

            const filter = (reaction: MessageReaction, user: User) => reaction.emoji.name && ['✅', '❎'].includes(reaction.emoji.name) && user.id === interaction.user.id ? true : false

            confirmMessage.awaitReactions({ filter, max: 1, time: 15000, errors: ['time'] })
                .then(async (collected) => {
                    const reaction = collected.first()

                    if(reaction) {
                        if(reaction.emoji.name === '✅') {
                            // On ajoute le cooldown si le membre exécutant la commande n'a pas le rôle Admin ou Modérateur
                            if(cd) await cooldown.addCooldown(`unlink_${leaderboardChoice === Leaderboards.ScoreSaber ? 'ss' : 'bl'}`, interaction.user.id, cd)

                            // On délie le profil ScoreSaber ou BeatLeader du membre
                            await players.remove(member.id, leaderboardChoice)

                            // On supprime les rôles pp du membre
                            const memberToUpdate = <GuildMember>guild.members.cache.find(m => m.id === member.id)
                            await roles.updateMemberPpRoles(leaderboardChoice, memberToUpdate, 0)

                            await confirmMessage.reactions.removeAll()

                            embedDesctiption = `✅ Le profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatSaber'} a bien été délié du compte ${userMention(member.id)}`
                            if(cd) embedDesctiption += `\nVous pourrez exécuter cette commande de nouveau \`${time(cd, TimestampStyles.RelativeTime)}\``

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
                    }
                }).catch(async () => {
                    await confirmMessage.reactions.removeAll()

                    embed = new Embed()
                            .setColor('#E74C3C')
                            .setDescription('❌ Vous avez mis trop de temps à répondre')

                    await interaction.editReply({ embeds: [embed] })
                })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'COOLDOWN_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}