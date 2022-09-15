import { CronJob } from 'cron'
import { Client } from 'discord.js'
import Logger from '../utils/logger.js'
import leaderboard from './leaderboard.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Actualise le classement de tous les membre du serveur
     * puis met à jour leurs rôles de pp
     * @param {Client} client client Discord
     */
    async refreshLeaderboard(client) {
        new CronJob('0 */12 * * *', async function() {
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