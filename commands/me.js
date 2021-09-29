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
                    throw new CommandInteractionError('Aucun profil ScoreSaber n\'est lié avec votre compte Discord\n:information_source: Utilisez la commande `/profile` afin de lier celui-ci')
                }
            }

            await interaction.deferReply()

            // Données ScoreSaber du membre
            const scoreSaberDatas = await scoresaber.getPlayerDatas(member.scoreSaberId)

            // Liste des embeds
            const embeds = []

            // Données de classement du membre
            let ld = await leaderboard.getMemberLeaderboard(memberId)

            // Si le membre n'a pas de données de classement, on ajoute celui-ci au classement du serveur
            if(!ld) {
                ld = await leaderboard.addMemberLeaderboard(memberId, scoreSaberDatas)

                embeds.push(new MessageEmbed()
                    .setColor('#2ECC71')
                    .setDescription(`:clap: <@${memberId}> a été ajouté au classement du serveur !`)
                )
            } else {
                ld = await leaderboard.updateMemberLeaderboard(memberId, scoreSaberDatas)
            }

            // On affiche les informations ScoreSaber du membre
            embeds.push(new MessageEmbed()
                .setColor('#000000')
                .setTitle(scoreSaberDatas.name)
                .setURL(scoreSaberDatas.url)
                .setThumbnail(scoreSaberDatas.avatar)
                .addFields(
                    { name: 'Rang', value: `:earth_africa: #${scoreSaberDatas.rank} | ${scoreSaberDatas.country !== '' ? countryCodeEmoji(scoreSaberDatas.country) : '🏴‍☠️'} #${scoreSaberDatas.countryRank}` },
                    { name: 'Rang Discord', value: `**PP**: ${ld.pp} / ${ld.total} joueurs\n**Précision**: ${ld.acc} / ${ld.total} joueurs` },
                    { name: 'Points de performance', value: `:clap: ${new Intl.NumberFormat('en-US').format(scoreSaberDatas.pp)}pp`, inline: true },
                    { name: 'Précision en classé', value: `:dart: ${(scoreSaberDatas.averageRankedAccuracy).toFixed(2)}%`, inline: true },
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
            if(error instanceof CommandInteractionError || error instanceof ScoreSaberError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}