import { MapDetail, SearchResponse } from '../api/beatsaver.js'
import { RankedModel } from '../models/ranked.model.js'
import { Leaderboards } from './gameLeaderboard.js'
import { BeatSaverError } from '../utils/error.js'
import Logger from '../utils/logger.js'

const BEATSAVER_API_URL = 'https://api.beatsaver.com/'
const MAPS_HASH_URL = BEATSAVER_API_URL + 'maps/hash/'
const SEARCH_MAPS_URL = BEATSAVER_API_URL + 'search/text/'

const wait = (s: number) => new Promise((res) => setTimeout(res, s * 1000))

export default class BeatSaver {
    /**
     * Envoi d'une requête à l'API de BeatSaver
     * @param url url de la requête
     * @returns résultat de la requête
     */
    static async send<T>(url: string, log: boolean = false): Promise<T> {
        let data
        let error = true
        let retries = 0

        do {
            if (log)
                Logger.log('BeatSaver', 'INFO', `Envoi de la requête "${url}"`)
            const res = await fetch(url)

            if (res.ok) {
                if (log)
                    Logger.log(
                        'BeatSaver',
                        'INFO',
                        'Requête envoyée avec succès'
                    )
                data = await res.json()

                error = false
            } else {
                if (res.status === 404)
                    throw Error('La ressource demandée est introuvable')
                if (res.status === 422)
                    throw Error('La ressource demandée est introuvable')
                if (res.status === 500) {
                    Logger.log(
                        'BeatSaver',
                        'ERROR',
                        'Erreur 500, nouvel essai dans 3 secondes'
                    )
                    if (retries < 5) await wait(3)
                    retries++
                }
                if (res.status === 429) {
                    Logger.log(
                        'BeatSaver',
                        'ERROR',
                        'Erreur 429, nouvel essai dans 60 secondes'
                    )
                    await wait(60)
                }

                error = true
            }
        } while (error)

        return data
    }

    /**
     * Récupération des détails d'une map en fonction d'un hash
     * @param hash hash de la map
     * @returns détail de la map
     */
    static async getMapByHash(hash: string) {
        try {
            const map = await this.send<MapDetail>(MAPS_HASH_URL + hash)
            return map
        } catch (error) {
            throw new BeatSaverError(
                `Récupération des informations de la map ${hash} depuis BeatSaver impossible : ${error.message}`
            )
        }
    }

    /**
     * Détermine le score maximum d'une map en fonction du nombre de notes
     * @param notes nombre de notes
     * @returns score maximum
     */
    static getMapMaxScore(notes: number) {
        let maxScore = 0
        if (notes < 14) {
            if (notes === 1) {
                maxScore = 115
            } else if (notes < 5) {
                maxScore = (notes - 1) * 230 + 115
            } else {
                maxScore = (notes - 5) * 460 + 1035
            }
        } else {
            maxScore = (notes - 13) * 920 + 4715
        }
        return maxScore
    }

    /**
     * Récupère les maps ranked en fonction de différents critères de recherche
     * @param leaderboard choix du leaderboard
     * @param starsMin nombre d'étoiles minimum
     * @param starsMax nombre d'étoiles maximum
     * @returns liste des maps ranked
     */
    static async searchRanked(
        leaderboard: Leaderboards,
        starsMin: number = 0,
        starsMax: number = 16
    ) {
        const ranked = await RankedModel.findAll({
            where: { leaderboard },
            order: [['map.updatedAt', 'desc']],
            raw: true
        })

        const rankedFiltered = ranked.filter((r) => {
            const version = r.map.versions[r.map.versions.length - 1]
            const diffsFiltered = version.diffs.filter(
                (d) =>
                    typeof d.stars !== 'undefined' &&
                    d.stars >= starsMin &&
                    d.stars <= starsMax
            )
            if (diffsFiltered.length > 0) {
                version.diffs = diffsFiltered
                return true
            }
            return false
        })

        return rankedFiltered.map((rf) => rf.map)
    }

    /**
     * Récupère les dernières maps ranked puis les insert en base de données
     * @returns nombre de nouvelles maps ranked ajoutées en base de données
     */
    static async getRanked(leaderboard: Leaderboards) {
        let page: number | null = 0
        let end = false

        do {
            const params = new URLSearchParams({
                leaderboard:
                    leaderboard === Leaderboards.ScoreSaber
                        ? 'ScoreSaber'
                        : 'BeatLeader',
                sortOrder: 'Latest',
                pageSize: '100'
            }).toString()
            const data = await this.send<SearchResponse>(
                SEARCH_MAPS_URL + `${page}?${params}`
            )

            const maps = data.docs.map((map) => {
                return { leaderboard, map }
            })

            await RankedModel.bulkCreate(maps)

            if (data.docs.length === 0) end = true

            if (!end) {
                page++
                await wait(3)
            } else {
                page = null
            }
        } while (page !== null && !end)
    }
}
