const CronJob = require('cron').CronJob
const { Client, MessageEmbed } = require('discord.js')
const Logger = require('../utils/logger')
const leaderboard = require('./leaderboard')
const scoresaber = require('./scoresaber')
const beatsaver = require('./beatsaver')
const config = require('../config.json')
const { ScoreSaberError } = require('../utils/error')

module.exports = {
    /**
     * Actualise le classement de tous les membre du serveur
     * puis met à jour leurs rôles de pp
     * @param {Client} client client Discord
     */
    refreshLeaderboard: async function(client) {
        new CronJob('0 0 * * *', async function() {
            const guild = client.guilds.cache.find(g => g.id === config.guild.id)

            await guild.members.fetch()
            const members = guild.members.cache

            await leaderboard.refreshLeaderboard(members)
        }, null, true, 'Europe/Paris')

        Logger.log('[CronManager] Tâche "refreshLeaderboard" chargée')
    },

    /**
     * Scan les nouveaux scores des membres et si il s'agit d'un top 1 FR,
     * alors on envoi le score dans le channel 'top-1-fr
     * @param {Client} client client Discord
     */
    top1fr: async function(client) {
        new CronJob('*/5 * * * *', async function() {
            try {
                const datas = await scoresaber.getTop1FR()

                for(const top1 of datas) {
                    const characteristic = (top1.difficultyRaw).split('_')[2]
                    const difficulty = (top1.difficultyRaw).split('_')[1]
                    const notes = top1.mapInfos.versions[0].diffs
                                    .filter(diff => characteristic.includes(diff.characteristic))
                                    .filter(diff => diff.difficulty === difficulty)[0].notes
                    const maxScore = beatsaver.getMaxScore(notes)

                    const embed = new MessageEmbed()
                        .setColor('#F1C40F')
                        .setTitle(top1.mapInfos.name)
                        .setURL(top1.leaderboardUrl)
                        .setThumbnail(top1.mapInfos.versions[0].coverURL)
                        .setDescription(`**${difficulty.replace('ExpertPlus', 'Expert+')}** par **${top1.mapInfos.metadata.levelAuthorName}**`)
                        .addFields(
                            { name: 'Joueur', value: `<@${top1.memberId}>`, inline: true },
                            { name: 'ScoreSaber', value: `[${top1.playerInfos.name}](${top1.playerInfos.url})`, inline: true },
                            { name: '\u200b', value: '\u200b', inline: true },
                            { name: 'Score', value: `${new Intl.NumberFormat('en-US').format(top1.scoreInfos.score)}`, inline: true },
                            { name: 'Précision', value: `${((top1.scoreInfos.score / maxScore) * 100).toFixed(2)}%`, inline: true },
                            { name: '\u200b', value: '\u200b', inline: true },
                            { name: 'BeatSaver', value: `[Lien](https://beatsaver.com/maps/${top1.mapInfos.id})`, inline: true },
                            { name: 'BSR', value: `!bsr ${top1.mapInfos.id}`, inline: true },
                            { name: '\u200b', value: '\u200b', inline: true }
                        )
                        .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)
                    
                    const guild = client.guilds.cache.find(g => g.id === config.guild.id)

                    const top1FRChannel = guild.channels.cache.find(c => c.id === config.guild.channels.top1fr.id)
                    top1FRChannel.send({ embeds: [embed] })
                }
            } catch(error) {
                Logger.log(`[ScoreSaber] [ERROR] ${error.message}`)
            }
        }, null, true, 'Europe/Paris')

        Logger.log('[CronManager] Tâche "top1fr" chargée')
    }
}