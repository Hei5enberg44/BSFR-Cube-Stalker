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
            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement des joueurs du serveur')

            const guild = client.guilds.cache.find(g => g.id === config.guild.id)

            await guild.members.fetch()
            const members = guild.members.cache

            await leaderboard.refreshLeaderboard(members)

            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement des joueurs du serveur terminée')
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "refreshLeaderboard" chargée')
    }
}