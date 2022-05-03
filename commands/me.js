const { userMention, bold } = require('@discordjs/builders')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, ScoreSaberError, BeatLeaderError } = require('../utils/error')
const { countryCodeEmoji } = require('../utils/country-code-emoji')
const roles = require('../controllers/roles')
const members = require('../controllers/members')
const leaderboard = require('../controllers/leaderboard')
const scoresaber = require('../controllers/scoresaber')
const beatleader = require('../controllers/beatleader')

module.exports = {
	data: {
		name: 'me',
		description: 'Affiche vos informations de joueur',
        options: [
            {
                type: 'STRING',
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
                type: 'USER',
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

            let member, memberId

            if(otherMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = otherMember.id

                // Informations sur le membre
                member = await members.getMember(memberId)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou non
                if(!member) {
                    throw new CommandInteractionError(`Aucun profil ScoreSaber n\'est lié pour le compte Discord ${userMention(memberId)}`)
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.member.id

                // Informations sur le membre
                member = await members.getMember(memberId)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou non
                if(!member) {
                    throw new CommandInteractionError('Aucun profil ScoreSaber n\'est lié avec votre compte Discord\nℹ️ Utilisez la commande `/link` afin de lier celui-ci')
                }
            }

            await interaction.deferReply()

            // Données de classement du membre
            let playerDatas
            if(leaderboardChoice === 'scoresaber') {
                playerDatas = await scoresaber.getPlayerDatas(member.playerId)
            } else if(leaderboardChoice === 'beatleader') {
                playerDatas = await beatleader.getPlayerDatas(member.playerId)
            }

            // Liste des embeds
            const embeds = []

            // Données de classement du membre
            let oldLd = await leaderboard.getMember(leaderboardChoice, memberId)
            let ld = oldLd

            // Si le membre n'a pas de données de classement, on ajoute celui-ci au classement du serveur
            if(!oldLd) {
                ld = await leaderboard.addMemberLeaderboard(leaderboardChoice, memberId, playerDatas)

                embeds.push(new Embed()
                    .setColor('#2ECC71')
                    .setDescription(`👏 ${userMention(memberId)} a été ajouté au classement du serveur !`)
                )
            } else { // Sinon, on le met à jour
                ld = await leaderboard.updateMemberLeaderboard(leaderboardChoice, memberId, playerDatas)
            }

            // Progressions du joueur
            let rankProgress = '', countryRankProgress = '', ppProgress = '', accProgress = ''
            let serverRankPPProgress = '', serverRankAccProgress = ''
            if(oldLd) {
                // Rang global
                const rankDiff = Math.abs(playerDatas.rank - oldLd.rank)
                if(playerDatas.rank < oldLd.rank) {
                    rankProgress = bold(`▲${rankDiff}`)
                } else if(playerDatas.rank > oldLd.rank) {
                    rankProgress = bold(`▼${rankDiff}`)
                }

                // Rank pays
                const countryRankDiff = Math.abs(playerDatas.countryRank - oldLd.countryRank)
                if(playerDatas.countryRank < oldLd.countryRank) {
                    countryRankProgress = bold(`▲${countryRankDiff}`)
                } else if(playerDatas.countryRank > oldLd.countryRank) {
                    countryRankProgress = bold(`▼${countryRankDiff}`)
                }

                // PP
                const ppDiff = new Intl.NumberFormat('en-US').format(Math.abs(playerDatas.pp - oldLd.pp))
                if(playerDatas.pp > oldLd.pp) {
                    ppProgress = bold(`▲${ppDiff}pp`)
                } else if(playerDatas.pp < oldLd.pp) {
                    ppProgress = bold(`▼${ppDiff}pp`)
                }

                // Acc
                const accDiff = (playerDatas.averageRankedAccuracy - oldLd.averageRankedAccuracy).toFixed(2)
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
            if(leaderboardChoice === 'scoresaber') {
                await roles.updateMemberPpRoles(memberToUpdate, playerDatas.pp)
            }

            // On affiche les informations ScoreSaber du membre
            const ldIconName = leaderboardChoice === 'scoresaber' ? 'ss' : (leaderboardChoice === 'beatleader' ? 'bl' : '')
            const ldIcon = interaction.guild.emojis.cache.find(e => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            embeds.push(new Embed()
                .setColor(roles.getMemberPpRoleColor(memberToUpdate) ?? memberToUpdate.displayHexColor)
                .setTitle(`${ldIcon ? `<:${ldIconName}:${ldIconId}> ` : ''}${playerDatas.name}`)
                .setURL(playerDatas.url)
                .setThumbnail(playerDatas.avatar)
                .addFields(
                    { name: 'Rang', value: `🌍 #${playerDatas.rank} ${rankProgress} | ${playerDatas.country !== '' ? countryCodeEmoji(playerDatas.country) : '🏴‍☠️'} #${playerDatas.countryRank} ${countryRankProgress}` },
                    { name: 'Rang Discord', value: `${bold('PP')}: ${(`#${ld.serverRankPP}`).replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')} / ${ld.serverLdTotal} joueurs ${serverRankPPProgress}\n${bold('Précision')}: ${(`#${ld.serverRankAcc}`).replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')} / ${ld.serverLdTotal} joueurs ${serverRankAccProgress}` },
                    { name: 'Points de performance', value: `👏 ${new Intl.NumberFormat('en-US').format(playerDatas.pp)}pp ${ppProgress}`, inline: true },
                    { name: 'Précision en classé', value: `🎯 ${(playerDatas.averageRankedAccuracy).toFixed(2)}% ${accProgress}`, inline: true },
                    { name: 'Meilleur score', value: `1️⃣ ${playerDatas.topPP.name} [${playerDatas.topPP.difficulty}] by ${playerDatas.topPP.author}` },
                    { name: 'Infos sur le meilleur score', value: `🦾 Rank: ${playerDatas.topPP.rank} | PP: ${new Intl.NumberFormat('en-US').format(playerDatas.topPP.pp)} | Acc: ${(playerDatas.topPP.acc).toFixed(2)}% | FC: ${playerDatas.topPP.fc ? 'Oui' : 'Non'}` }
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