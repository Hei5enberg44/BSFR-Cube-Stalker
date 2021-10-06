const { MessageEmbed } = require('discord.js')
const { CommandError, CommandInteractionError, ScoreSaberError } = require('../utils/error')
const { countryCodeEmoji } = require('../utils/country-code-emoji')
const roles = require('../controllers/roles')
const members = require('../controllers/members')
const leaderboard = require('../controllers/leaderboard')
const scoresaber = require('../controllers/scoresaber')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'me',
		description: 'Affiche les informations d\'un joueur',
        options: [
            {
                type: 'USER',
                name: 'joueur',
                description: 'Affiche les informations d\'un autre joueur',
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
            
            const otherMember = interaction.options.getUser('joueur')

            let member, memberId

            if(otherMember) {
                // Identifiant du membre pour lequel aficher les informations
                memberId = otherMember.id

                // Informations sur le membre
                member = await members.getMember(memberId)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou non
                if(!member) {
                    throw new CommandInteractionError(`Aucun profil ScoreSaber n\'est lié pour le compte Discord <@${memberId}>`)
                }
            } else {
                // Identifiant du membre exécutant la commande
                memberId = interaction.member.id

                // Informations sur le membre
                member = await members.getMember(memberId)

                // On vérifie ici si le membre a lié son compte ScoreSaber ou non
                if(!member) {
                    throw new CommandInteractionError('Aucun profil ScoreSaber n\'est lié avec votre compte Discord\n:information_source: Utilisez la commande `/link` afin de lier celui-ci')
                }
            }

            await interaction.deferReply()

            // Données ScoreSaber du membre
            const scoreSaberDatas = await scoresaber.getPlayerDatas(member.scoreSaberId)

            // Liste des embeds
            const embeds = []

            // Données de classement du membre
            let oldLd = await leaderboard.getMember(memberId)
            let ld = oldLd

            // Si le membre n'a pas de données de classement, on ajoute celui-ci au classement du serveur
            if(!oldLd) {
                ld = await leaderboard.addMemberLeaderboard(memberId, scoreSaberDatas)

                embeds.push(new MessageEmbed()
                    .setColor('#2ECC71')
                    .setDescription(`:clap: <@${memberId}> a été ajouté au classement du serveur !`)
                )
            } else { // Sinon, on le met à jour
                ld = await leaderboard.updateMemberLeaderboard(memberId, scoreSaberDatas)
            }

            // Progressions du joueur
            let rankProgress = '', countryRankProgress = '', ppProgress = '', accProgress = ''
            let serverRankPPProgress = '', serverRankAccProgress = ''
            if(oldLd) {
                // Rang global
                const rankDiff = Math.abs(scoreSaberDatas.rank - oldLd.rank)
                if(scoreSaberDatas.rank < oldLd.rank) {
                    rankProgress = `**▲${rankDiff}**`
                } else if(scoreSaberDatas.rank > oldLd.rank) {
                    rankProgress = `**▼${rankDiff}**`
                }

                // Rank pays
                const countryRankDiff = Math.abs(scoreSaberDatas.countryRank - oldLd.countryRank)
                if(scoreSaberDatas.countryRank < oldLd.countryRank) {
                    countryRankProgress = `**▲${countryRankDiff}**`
                } else if(scoreSaberDatas.countryRank > oldLd.countryRank) {
                    countryRankProgress = `**▼${countryRankDiff}**`
                }

                // PP
                const ppDiff = new Intl.NumberFormat('en-US').format(Math.abs(scoreSaberDatas.pp - oldLd.pp))
                if(scoreSaberDatas.pp > oldLd.pp) {
                    ppProgress = `**▲${ppDiff}pp**`
                } else if(scoreSaberDatas.pp < oldLd.pp) {
                    ppProgress = `**▼${ppDiff}pp**`
                }

                // Acc
                const accDiff = (Math.abs(scoreSaberDatas.averageRankedAccuracy - oldLd.averageRankedAccuracy)).toFixed(2)
                if(scoreSaberDatas.averageRankedAccuracy > oldLd.averageRankedAccuracy) {
                    accProgress = `**▲${accDiff}%**`
                } else if(scoreSaberDatas.averageRankedAccuracy < oldLd.averageRankedAccuracy) {
                    accProgress = `**▼${accDiff}%**`
                }

                // Rank Server PP
                const serverPPDiff = Math.abs(ld.serverRankPP - oldLd.serverRankPP)
                if(ld.serverRankPP < oldLd.serverRankPP) {
                    serverRankPPProgress = `**▲${serverPPDiff}**`
                } else if(ld.serverRankPP > oldLd.serverRankPP) {
                    serverRankPPProgress = `**▼${serverPPDiff}**`
                }

                // Rank Server Acc
                const serverAccDiff = Math.abs(ld.serverRankAcc - oldLd.serverRankAcc)
                if(ld.serverRankAcc < oldLd.serverRankAcc) {
                    serverRankAccProgress = `**▲${serverAccDiff}**`
                } else if(ld.serverRankAcc > oldLd.serverRankAcc) {
                    serverRankAccProgress = `**▼${serverAccDiff}**`
                }
            }

            // On affiche les informations ScoreSaber du membre
            embeds.push(new MessageEmbed()
                .setColor('#000000')
                .setTitle(scoreSaberDatas.name)
                .setURL(scoreSaberDatas.url)
                .setThumbnail(scoreSaberDatas.avatar)
                .addFields(
                    { name: 'Rang', value: `:earth_africa: #${scoreSaberDatas.rank} ${rankProgress} | ${scoreSaberDatas.country !== '' ? countryCodeEmoji(scoreSaberDatas.country) : '🏴‍☠️'} #${scoreSaberDatas.countryRank} ${countryRankProgress}` },
                    { name: 'Rang Discord', value: `**PP**: ${(`#${ld.serverRankPP}`).replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')} / ${ld.serverLdTotal} joueurs ${serverRankPPProgress}\n**Précision**: ${(`#${ld.serverRankAcc}`).replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')} / ${ld.serverLdTotal} joueurs ${serverRankAccProgress}` },
                    { name: 'Points de performance', value: `:clap: ${new Intl.NumberFormat('en-US').format(scoreSaberDatas.pp)}pp ${ppProgress}`, inline: true },
                    { name: 'Précision en classé', value: `:dart: ${(scoreSaberDatas.averageRankedAccuracy).toFixed(2)}% ${accProgress}`, inline: true },
                    { name: 'Meilleur score', value: `:one: ${scoreSaberDatas.topPP.songDetails}` },
                    { name: 'Infos sur le meilleur score', value: `:mechanical_arm: Rank: ${scoreSaberDatas.topPP.rank} | Score: ${scoreSaberDatas.topPP.score} | PP: ${scoreSaberDatas.topPP.pp}` }
                )
                .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)
            )

            // On met à jour les rôles du membre en fonction de son nombre de pp
            const memberToUpdate = otherMember ? interaction.guild.members.cache.find(m => m.id === otherMember.id) : interaction.member
            await roles.updateMemberPpRoles(memberToUpdate, scoreSaberDatas.pp)
            
            await interaction.editReply({ embeds: embeds })
        } catch(error) {
            console.log(error)
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}