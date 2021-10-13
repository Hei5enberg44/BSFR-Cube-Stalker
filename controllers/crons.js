const CronJob = require('cron').CronJob
const { Client, MessageEmbed } = require('discord.js')
const Logger = require('../utils/logger')
const leaderboard = require('./leaderboard')
const scoresaber = require('./scoresaber')
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

            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement des joueurs du  terminée')
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "refreshLeaderboard" chargée')
    },

    /**
     * Scan les nouveaux scores des membres et si il s'agit d'un top 1 FR,
     * alors on envoi le score dans le channel 'top-1-fr
     * @param {Client} client client Discord
     */
    top1fr: async function(client) {
        new CronJob('*/1 * * * *', async function() {
            Logger.log('Top1FR', 'INFO', 'Récupération des tops 1 FR')

            const datas = await scoresaber.getTop1FR()

            for(const top1 of datas) {
                await scoresaber.deleteTop1FR(top1)

                const embed = new MessageEmbed()
                    .setColor('#F1C40F')
                    .setTitle(top1.songName)
                    .setURL(`https://scoresaber.com/leaderboard/${top1.leaderboardId}`)
                    .setThumbnail(top1.songCoverUrl)
                    .setDescription(`**${top1.levelDifficulty} (${top1.levelGameMode})** par **${top1.levelAuthorName}**\n**Date :** ${top1.timeSet}`)
                    .addFields(
                        { name: 'Joueur', value: `<@${top1.memberId}>`, inline: true },
                        { name: 'ScoreSaber', value: `[${top1.scoreSaberName}](https://scoresaber.com/u/${top1.scoreSaberId})`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Score', value: `${new Intl.NumberFormat('en-US').format(top1.score)}`, inline: true },
                        { name: 'Précision', value: `${(top1.acc).toFixed(2)}%`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'BeatSaver', value: `[Lien](https://beatsaver.com/maps/${top1.levelKey})`, inline: true },
                        { name: 'BSR', value: `!bsr ${top1.levelKey}`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true }
                    )
                    .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)
                
                const guild = client.guilds.cache.find(g => g.id === config.guild.id)

                const top1FRChannel = guild.channels.cache.find(c => c.id === config.guild.channels.top1fr.id)
                top1FRChannel.send({ embeds: [embed] })
            }

            Logger.log('Top1FR', 'INFO', 'Récupération des tops 1 FR terminée')
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "top1fr" chargée')
    }
}