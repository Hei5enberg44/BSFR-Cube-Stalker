const CronJob = require('cron').CronJob
const { Client } = require('discord.js')
const { userMention, bold, hyperlink, time } = require('@discordjs/builders')
const Embed = require('../utils/embed')
const { Top1Error } = require('../utils/error')
const Logger = require('../utils/logger')
const leaderboard = require('./leaderboard')
const roles = require('./roles')
const top1 = require('./top1')
const config = require('../config.json')

module.exports = {
    /**
     * Actualise le classement de tous les membre du serveur
     * puis met à jour leurs rôles de pp
     * @param {Client} client client Discord
     */
    refreshLeaderboard: async function(client) {
        new CronJob('0 0 * * *', async function() {
            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement des joueurs du serveur')

            const guild = client.guilds.cache.find(g => g.id === config.guild.id)

            await guild.members.fetch()
            const members = guild.members.cache

            await leaderboard.refreshLeaderboard(members)

            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement des joueurs du serveur terminée')
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "refreshLeaderboard" chargée')
    },

    /**
     * Scan des nouveaux top 1 FR des membres du classement serveur
     */
    scanTop1FR: async function() {
        new CronJob('*/5 * * * *', async function() {
            Logger.log('Top1FR', 'INFO', 'Scan des nouveaux top 1 FR depuis ScoreSaber')

            try {
                await top1.scanTop1FR()
            } catch(error) {
                if(error instanceof Top1Error) {
                    Logger.log('Top1FR', 'ERROR', error.message)
                }
            }

            Logger.log('Top1FR', 'INFO', 'Scan des nouveaux top 1 FR terminé')
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "scanTop1FR" chargée')
    },

    /**
     * Récupération des top 1 FR depuis la base de données
     * et envoi de ceux-ci dans le channel 'top-1-fr'
     * @param {Client} client client Discord
     */
    postTop1FR: async function(client) {
        new CronJob('*/2 * * * *', async function() {
            Logger.log('Top1FR', 'INFO', 'Récupération des nouveaux top 1 FR depuis la base de données')

            const guild = client.guilds.cache.find(g => g.id === config.guild.id)
            await guild.members.fetch()

            const datas = await top1.getTop1FR()

            for(const top of datas) {
                await top1.deleteTop1FR(top.id)

                const member = guild.members.cache.find(m => m.id === top.memberId)
                const color = member ? roles.getMemberPpRoleColor(member) : null

                const rankedIconName = 'ss'
                const rankedIcon = guild.emojis.cache.find(e => e.name === rankedIconName)
                const rankedIconId = rankedIcon?.id

                const embed = new Embed()
                    .setColor(color ?? '#F1C40F')
                    .setTitle(top.songName)
                    .setURL(`https://scoresaber.com/leaderboard/${top.leaderboardId}`)
                    .setThumbnail(top.songCoverUrl)
                    .setDescription(`${(top.ranked && rankedIcon) ? `<:${rankedIconName}:${rankedIconId}> ` : ''}${bold(`${top.levelDifficulty.replace('ExpertPlus', 'Expert+')} (${top.levelGameMode})`)} par ${bold(top.levelAuthorName)}\n${bold('Date')} : ${time(new Date(top.timeSet))}`)
                    .addFields(
                        { name: 'Joueur', value: `${userMention(top.memberId)}`, inline: true },
                        { name: 'ScoreSaber', value: hyperlink(top.scoreSaberName, `https://scoresaber.com/u/${top.scoreSaberId}`), inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Score', value: `${new Intl.NumberFormat('en-US').format(top.score)}`, inline: true },
                        { name: 'Précision', value: `${(top.acc).toFixed(2)}%`, inline: true },
                        { name: 'Rang 🌍', value: `#${top.rank}`, inline: true },
                        { name: 'BeatSaver', value: hyperlink('Lien', `https://beatsaver.com/maps/${top.levelKey}`), inline: true },
                        { name: 'BSR', value: `!bsr ${top.levelKey}`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true }
                    )

                if(top.beatenScoreSaberId !== '') embed.addField('Bien joué !', `Tu es passé(e) devant ${hyperlink(top.beatenScoreSaberName, `https://scoresaber.com/u/${top.beatenScoreSaberId}`)}`)

                const top1FRChannel = guild.channels.cache.find(c => c.id === config.guild.channels.top1fr)
                top1FRChannel.send({ embeds: [embed] })
            }

            Logger.log('Top1FR', 'INFO', 'Récupération des nouveaux top 1 FR terminée')
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "postTop1FR" chargée')
    }
}