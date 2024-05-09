import { CronJob } from 'cron'
import { Client, Guild } from 'discord.js'
import leaderboard from './leaderboard.js'
import beatsaver from './beatsaver.js'
import { Leaderboards } from './gameLeaderboard.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default class Crons {
    private client: Client

    constructor(client: Client) {
        this.client = client
    }

    /**
     * Actualise le classement de tous les membre du serveur
     * puis met à jour leurs rôles de pp
     */
    async refreshLeaderboard() {
        const client = this.client

        new CronJob('0 */12 * * *', async function() {
            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement des joueurs du serveur')

            const guild = <Guild>client.guilds.cache.find(g => g.id === config.guild.id)

            await guild.members.fetch()
            const members = guild.members.cache

            await leaderboard.refreshLeaderboard(Leaderboards.ScoreSaber, members)

            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement des joueurs du serveur terminée')
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "refreshLeaderboard" chargée')
    }

    /**
     * Requête l'api de BeatSaver afin de récupérer les dernières maps ranked
     */
    async getLastRankedMaps() {
        new CronJob('0 0 * * *', async function() {
            Logger.log('BeatSaver', 'INFO', 'Recherche de nouvelles maps ranked')

            const newMaps = await beatsaver.getLastRanked()

            Logger.log('BeatSaver', 'INFO', `Recherche de nouvelles maps ranked terminée : ${newMaps} nouvelles maps ranked ont été ajoutées en base de données.`)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "getLastRankedMaps" chargée')
    }
}