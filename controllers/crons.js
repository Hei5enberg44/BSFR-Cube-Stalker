const CronJob = require('cron').CronJob
const { Client } = require('discord.js')
const Logger = require('../utils/logger')
const leaderboard = require('./leaderboard')
const config = require('../config.json')

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
    }
}