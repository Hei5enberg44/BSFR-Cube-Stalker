import { CronJob } from 'cron'
import { Client, Guild } from 'discord.js'
import leaderboard from './leaderboard.js'
import beatsaver from './beatsaver.js'
import { Leaderboards } from './gameLeaderboard.js'
import { BeatLeaderOAuth } from './beatleader-oauth.js'
import { OAuthModel, RankedModel } from './database.js'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

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

        new CronJob('0 0 * * *', async function() {
            const guild = <Guild>client.guilds.cache.find(g => g.id === config.guild.id)

            const members = guild.members.cache

            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement ScoreSaber des joueurs du serveur')
            await leaderboard.refreshLeaderboard(Leaderboards.ScoreSaber, members)
            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement ScoreSaber des joueurs du serveur terminée')

            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement BeatLeader des joueurs du serveur')
            await leaderboard.refreshLeaderboard(Leaderboards.BeatLeader, members)
            Logger.log('Leaderboard', 'INFO', 'Actualisation du classement BeatLeader des joueurs du serveur terminée')
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "refreshLeaderboard" chargée')
    }

    /**
     * Requête l'api de BeatSaver afin de mettre à jour les maps ranked
     */
    async getRankedMaps() {
        new CronJob('0 */4 * * *', async function() {
            Logger.log('BeatSaver', 'INFO', 'Actualisation des maps ranked')

            await RankedModel.truncate({ force: true })
            await beatsaver.getRanked(Leaderboards.ScoreSaber)
            await beatsaver.getRanked(Leaderboards.BeatLeader)

            Logger.log('BeatSaver', 'INFO', `Actualisation des maps ranked terminée.`)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "getRankedMaps" chargée')
    }

    /**
     * Vérification de la validité des tokens OAuth et actualisation de ceux-ci si nécessaire
     */
    async checkBeatLeaderOAuthTokens() {
        new CronJob('* * * * *', async function() {
            const tokens = await OAuthModel.findAll()
            for(const token of tokens) {
                if(token.name.match(/^beatleader_/)) {
                    await BeatLeaderOAuth.checkToken(token)
                }
            }
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "checkBeatLeaderOAuthTokens" chargée')
    }
}