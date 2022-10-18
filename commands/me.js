import { ApplicationCommandOptionType, CommandInteraction, userMention, bold, hyperlink } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError, ScoreSaberError, BeatLeaderError } from '../utils/error.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
import roles from '../controllers/roles.js'
import players from '../controllers/players.js'
import leaderboard from '../controllers/leaderboard.js'
import scoresaber from '../controllers/scoresaber.js'
import beatleader from '../controllers/beatleader.js'

export default {
    data: {
        name: 'me',
        description: 'Affiche vos informations de joueur',
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
                required: false
            },
            {
                type: ApplicationCommandOptionType.User,
                name: 'joueur',
                description: 'Affiche les informations d\'un autre joueur',
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
            const leaderboardChoice = interaction.options.getString('leaderboard') ?? 'scoresaber'
            const otherMember = interaction.options.getUser('joueur')

            await interaction.deferReply()

            let player, memberId

            if(otherMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = otherMember.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!player) throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} n'est lié pour le compte Discord ${userMention(memberId)}`)
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.member.id

                // Informations sur le joueur
                player = await players.get(memberId, leaderboardChoice)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou BeatLeader
                if(!player) {
                    const linkCommand = interaction.guild.commands.cache.find(c => c.name === 'link')
                    throw new CommandInteractionError(`Aucun profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} n'est lié avec votre compte Discord\nℹ️ Utilisez la commande </${linkCommand.name}:${linkCommand.id}> afin de lier celui-ci`)
                }
            }

            // Données de classement du joueur
            let playerData
            if(leaderboardChoice === 'scoresaber') {
                playerData = await scoresaber.getPlayerData(player.playerId)
            } else if(leaderboardChoice === 'beatleader') {
                playerData = await beatleader.getPlayerData(player.playerId)
            }

            // Liste des embeds
            const embeds = []

            // Données de classement du joueur
            const oldLd = await leaderboard.getPlayer(memberId, leaderboardChoice)
            let ld = oldLd

            // Si le joueur n'a pas de données de classement, on ajoute celui-ci au classement du serveur
            if(!oldLd) {
                ld = await leaderboard.addPlayerLeaderboard(memberId, leaderboardChoice, playerData)

                embeds.push(new Embed()
                    .setColor('#2ECC71')
                    .setDescription(`👏 ${userMention(memberId)} a été ajouté au classement du serveur !`)
                )
            } else { // Sinon, on le met à jour
                ld = await leaderboard.updatePlayerLeaderboard(memberId, leaderboardChoice, playerData)
            }

            // Mise à jour du joueur
            await players.update(memberId, leaderboardChoice, playerData, ld)

            // Progressions du joueur
            let rankProgress = '', countryRankProgress = '', ppProgress = '', accProgress = ''
            let serverRankPPProgress = '', serverRankAccProgress = ''
            if(oldLd) {
                // Rang global
                const rankDiff = Math.abs(playerData.rank - oldLd.rank)
                if(playerData.rank < oldLd.rank) {
                    rankProgress = bold(`▲${rankDiff}`)
                } else if(playerData.rank > oldLd.rank) {
                    rankProgress = bold(`▼${rankDiff}`)
                }

                // Rank pays
                const countryRankDiff = Math.abs(playerData.countryRank - oldLd.countryRank)
                if(playerData.countryRank < oldLd.countryRank) {
                    countryRankProgress = bold(`▲${countryRankDiff}`)
                } else if(playerData.countryRank > oldLd.countryRank) {
                    countryRankProgress = bold(`▼${countryRankDiff}`)
                }

                // PP
                const ppDiff = new Intl.NumberFormat('en-US').format(Math.abs(playerData.pp - oldLd.pp))
                if(playerData.pp > oldLd.pp) {
                    ppProgress = bold(`▲${ppDiff}pp`)
                } else if(playerData.pp < oldLd.pp) {
                    ppProgress = bold(`▼${ppDiff}pp`)
                }

                // Acc
                const accDiff = (playerData.averageRankedAccuracy - oldLd.averageRankedAccuracy).toFixed(2)
                if(accDiff > 0) {
                    accProgress = bold(`▲${Math.abs(accDiff)}%`)
                } else if(accDiff < 0) {
                    accProgress = bold(`▼${Math.abs(accDiff)}%`)
                }

                // Rank Server PP
                const serverPPDiff = Math.abs(ld.serverRankPP - oldLd.serverRankPP)
                if(ld.serverRankPP < oldLd.serverRankPP) {
                    serverRankPPProgress = bold(`▲${serverPPDiff}`)
                } else if(ld.serverRankPP > oldLd.serverRankPP) {
                    serverRankPPProgress = bold(`▼${serverPPDiff}`)
                }

                // Rank Server Acc
                const serverAccDiff = Math.abs(ld.serverRankAcc - oldLd.serverRankAcc)
                if(ld.serverRankAcc < oldLd.serverRankAcc) {
                    serverRankAccProgress = bold(`▲${serverAccDiff}`)
                } else if(ld.serverRankAcc > oldLd.serverRankAcc) {
                    serverRankAccProgress = bold(`▼${serverAccDiff}`)
                }
            }

            // On met à jour les rôles du membre en fonction de son nombre de pp
            const memberToUpdate = otherMember ? interaction.guild.members.cache.find(m => m.id === otherMember.id) : interaction.member
            if(leaderboardChoice === 'scoresaber') await roles.updateMemberPpRoles(memberToUpdate, playerData.pp)

            // On affiche les informations du joueur
            const ldIconName = leaderboardChoice === 'scoresaber' ? 'ss' : (leaderboardChoice === 'beatleader' ? 'bl' : '')
            const ldIcon = interaction.guild.emojis.cache.find(e => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            embeds.push(new Embed()
                .setColor(roles.getMemberPpRoleColor(memberToUpdate) ?? memberToUpdate.displayHexColor)
                .setTitle(`${ldIcon ? `<:${ldIconName}:${ldIconId}> ` : ''}${playerData.name}`)
                .setURL(playerData.url)
                .setThumbnail(playerData.avatar)
                .addFields(
                    { name: 'Rang', value: `🌍 #${playerData.rank} ${rankProgress} | ${playerData.country !== '' ? countryCodeEmoji(playerData.country) : '🏴‍☠️'} #${playerData.countryRank} ${countryRankProgress}` },
                    { name: 'Rang Discord', value: `${bold('PP')}: ${(`#${ld.serverRankPP}`).replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')} / ${ld.serverLdTotal} joueurs ${serverRankPPProgress}\n${bold('Précision')}: ${(`#${ld.serverRankAcc}`).replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')} / ${ld.serverLdTotal} joueurs ${serverRankAccProgress}` },
                    { name: 'Points de performance', value: `👏 ${new Intl.NumberFormat('en-US').format(playerData.pp)}pp ${ppProgress}`, inline: true },
                    { name: 'Précision en classé', value: `🎯 ${(playerData.averageRankedAccuracy).toFixed(2)}% ${accProgress}`, inline: true },
                    { name: 'Meilleur score', value: `1️⃣ ${playerData.topPP.name} [${playerData.topPP.difficulty.replace('ExpertPlus', 'Expert+')}] by ${playerData.topPP.author}` },
                    { name: 'Infos sur le meilleur score', value: `🦾 Rank: ${playerData.topPP.rank} | PP: ${new Intl.NumberFormat('en-US').format(playerData.topPP.pp)} | Acc: ${(playerData.topPP.acc).toFixed(2)}% | FC: ${playerData.topPP.fc ? 'Oui' : 'Non'}${playerData.topPP.replay ? ` | ${hyperlink('Replay', playerData.topPP.replay)}` : ''}` }
                )
            )
            
            await interaction.editReply({ embeds: embeds })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError || error instanceof BeatLeaderError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}