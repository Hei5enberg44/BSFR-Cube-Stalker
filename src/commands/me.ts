import { Guild, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ApplicationCommand, chatInputApplicationCommandMention, userMention, bold, GuildMember } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import roles from '../controllers/roles.js'
import players from '../controllers/players.js'
import leaderboard from '../controllers/leaderboard.js'
import cardgenerator from '../controllers/cardgenerator.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'
import { PlayerRanking, PlayerProgress } from '../interfaces/player.interface.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('me')
        .setDescription('Affiche vos informations de joueur')
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
                .setDescription('Affiche les informations d\'un autre joueur')
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
            let leaderboardChoice = interaction.options.getString('leaderboard') as Leaderboards | null
            const targetMember = interaction.options.getUser('joueur')
            
            const guild = <Guild>interaction.guild

            await interaction.deferReply()

            let oldPlayerData, memberId

            if(targetMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = targetMember.id

                // Si le membre cible est le bot
                if(memberId === config.clientId) throw new CommandInteractionError('Moi ? Je ne joue pas à ce vulgaire jeu. Je me contente d\'afficher vos piètres scores, c\'est déjà pas mal.')

                // Informations sur le joueur
                oldPlayerData = leaderboardChoice ? await players.get(memberId, leaderboardChoice) : await players.get(memberId, Leaderboards.ScoreSaber) || await players.get(memberId, Leaderboards.BeatLeader)
                if(!leaderboardChoice && oldPlayerData) leaderboardChoice = oldPlayerData.leaderboard as Leaderboards

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!leaderboardChoice) {
                    throw new CommandInteractionError(`Aucun profil ScoreSaber ou BeatLeader n'est lié pour le compte Discord ${userMention(memberId)}`)
                } else if(!oldPlayerData) {
                    throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié pour le compte Discord ${userMention(memberId)}`)
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.user.id

                // Informations sur le joueur
                oldPlayerData = leaderboardChoice ? await players.get(memberId, leaderboardChoice) : await players.get(memberId, Leaderboards.ScoreSaber) || await players.get(memberId, Leaderboards.BeatLeader)
                if(!leaderboardChoice && oldPlayerData) leaderboardChoice = oldPlayerData.leaderboard as Leaderboards

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!leaderboardChoice) {
                    const linkCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'link')
                    throw new CommandInteractionError(`Aucun profil ScoreSaber ou BeatLeader n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`)
                } else if(!oldPlayerData) {
                    const linkCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'link')
                    throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`)
                }
            }

            // Données de classement du joueur
            const gameLeaderboard = new GameLeaderboard(leaderboardChoice)
            const playerData = await gameLeaderboard.requests.getPlayerData(oldPlayerData.playerId)

            // Liste des embeds
            const embeds = []

            // Données de classement du joueur
            const oldPlayerLd = await leaderboard.getPlayer(leaderboardChoice, memberId)

            // Si le joueur n'a pas de données de classement, on ajoute celui-ci au classement du serveur
            if(!oldPlayerLd) {
                await leaderboard.addPlayerLeaderboard(leaderboardChoice, memberId, playerData)

                embeds.push(new Embed()
                    .setColor('#2ECC71')
                    .setDescription(`👏 ${userMention(memberId)} a été ajouté au classement du serveur !`)
                )
            } else { // Sinon, on le met à jour
                await leaderboard.updatePlayerLeaderboard(leaderboardChoice, memberId, playerData)
            }

            const playerLd = await leaderboard.getPlayer(leaderboardChoice, memberId) as PlayerRanking

            // Mise à jour du joueur
            await players.update(memberId, leaderboardChoice, playerData, playerLd)

            // Progressions du joueur
            let playerProgress: PlayerProgress | null = null
            const progressStatus = []
            if(oldPlayerLd) {
                playerProgress = {
                    rankDiff: playerLd.rank - oldPlayerLd.rank,
                    countryRankDiff: playerLd.countryRank - oldPlayerLd.countryRank,
                    ppDiff: playerLd.pp - oldPlayerLd.pp,
                    accDiff: parseFloat((parseFloat(playerLd.averageRankedAccuracy.toFixed(2)) - parseFloat(oldPlayerLd.averageRankedAccuracy.toFixed(2))).toFixed(2)),
                    serverPPDiff: playerLd.serverRankPP - oldPlayerLd.serverRankPP,
                    serverAccDiff: playerLd.serverRankAcc - oldPlayerLd.serverRankAcc
                }

                // Rang global
                const rankDiff = Math.abs(playerProgress.rankDiff)
                if(playerLd.rank !== oldPlayerLd.rank)
                    progressStatus.push(`Tu as ${bold(`${playerLd.rank < oldPlayerLd.rank ? 'gagné' : 'perdu'} ${rankDiff} place${rankDiff > 1 ? 's' : ''}`)} dans le classement mondial`)

                // Rank pays
                const countryRankDiff = Math.abs(playerProgress.countryRankDiff)
                if(playerLd.countryRank !== oldPlayerLd.countryRank)
                    progressStatus.push(`Tu as ${bold(`${playerLd.countryRank < oldPlayerLd.countryRank ? 'gagné' : 'perdu'} ${countryRankDiff} place${countryRankDiff > 1 ? 's' : ''}`)} dans le classement ${countryCodeEmoji(playerData.country)}`)

                // PP
                const ppDiff = new Intl.NumberFormat('en-US').format(Math.abs(playerProgress.ppDiff))
                if(playerLd.pp !== oldPlayerLd.pp)
                    progressStatus.push(`Tu as ${bold(`${playerLd.pp > oldPlayerLd.pp ? 'gagné' : 'perdu'} ${ppDiff}pp`)}`)

                // Acc
                const accDiff = Math.abs(playerProgress.accDiff)
                if(parseFloat(playerLd.averageRankedAccuracy.toFixed(2)) !== parseFloat(oldPlayerLd.averageRankedAccuracy.toFixed(2)))
                    progressStatus.push(`Tu as ${bold(`${playerLd.averageRankedAccuracy > oldPlayerLd.averageRankedAccuracy ? 'gagné' : 'perdu'} ${accDiff}%`)} de précision moyenne en classé`)

                // Rank Server PP
                const serverPPDiff = Math.abs(playerProgress.serverPPDiff)
                if(playerLd.serverRankPP !== oldPlayerLd.serverRankPP)
                    progressStatus.push(`Tu as ${bold(`${playerLd.serverRankPP < oldPlayerLd.serverRankPP ? 'gagné' : 'perdu'} ${serverPPDiff} place${serverPPDiff > 1 ? 's' : ''}`)} dans le classement des points de performance du serveur`)

                // Rank Server Acc
                const serverAccDiff = Math.abs(playerProgress.serverAccDiff)
                if(playerLd.serverRankAcc !== oldPlayerLd.serverRankAcc)
                    progressStatus.push(`Tu as ${bold(`${playerLd.serverRankAcc < oldPlayerLd.serverRankAcc ? 'gagné' : 'perdu'} ${serverAccDiff} place${serverAccDiff > 1 ? 's' : ''}`)} dans le classement de précision moyenne en classé du serveur`)
            }

            const meCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'me')
            if(progressStatus.length === 0) progressStatus.push(`Pas de progression depuis le dernier ${chatInputApplicationCommandMention(meCommand.name, meCommand.id)}`)

            // On met à jour les rôles du membre en fonction de son nombre de pp
            const memberToUpdate = (targetMember ? guild.members.cache.find(m => m.id === targetMember.id) : interaction.member)  as GuildMember
            await roles.updateMemberPpRoles(leaderboardChoice, memberToUpdate, playerData.pp)

            // On affiche les informations du joueur
            const ldIconName = leaderboardChoice === Leaderboards.ScoreSaber ? 'ss' : (leaderboardChoice === 'beatleader' ? 'bl' : '')
            const ldIcon = guild.emojis.cache.find(e => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            embeds.push(new Embed()
                .setColor(roles.getMemberPpRoleColor(leaderboardChoice, memberToUpdate) ?? memberToUpdate.displayHexColor)
                .setTitle(`${ldIcon ? `<:${ldIconName}:${ldIconId}> ` : ''} Profil de ${playerData.name}`)
                .setURL(playerData.url)
                .setDescription(progressStatus.map(p => `- ${p}`).join('\n'))
            )

            const embedProgress = new Embed()
                .setColor('#F1C40F')
                .setDescription(`🛠️ Récupération du profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} en cours...`)

            await interaction.editReply({ embeds: [embedProgress] })

            const date = new Date()
            if(date.getDate() === 1 && date.getMonth() === 3) {
                const card = await cardgenerator.getStonkerCard(leaderboardChoice, memberToUpdate, playerData, playerLd, playerProgress)

                await interaction.editReply({ files: [{attachment: card.name, name: `${playerData.id}.webp`}], embeds: [] })
    
                card.removeCallback()
            } else {
                const card = await cardgenerator.getCard(leaderboardChoice, memberToUpdate, playerData, playerLd, playerProgress)

                await interaction.editReply({ files: [{attachment: card.name, name: `${playerData.id}.webp`}], embeds: embeds })
    
                card.removeCallback()
            }
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'SCORESABER_ERROR' || error.name === 'BEATLEADER_ERROR' || error.name === 'LEADERBOARD_ERROR' || error.name === 'PLAYER_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}