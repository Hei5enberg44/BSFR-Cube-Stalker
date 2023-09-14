import { components as BeatSaverAPI } from '../api/beatsaver.js'
import { RankedModel } from './database.js'
import { BeatSaverError } from '../utils/error.js'
import Logger from '../utils/logger.js'

type MapDetail = BeatSaverAPI['schemas']['MapDetail']
type SearchResponse = BeatSaverAPI['schemas']['SearchResponse']

const BEATSAVER_API_URL = 'https://beatsaver.com/api'
const MAPS_HASH_URL = BEATSAVER_API_URL + '/maps/hash/'
const LATEST_MAPS_URL = BEATSAVER_API_URL + '/maps/latest'

const wait = (s: number) => new Promise((res) => setTimeout(res, s * 1000))

export default class BeatSaver {
    /**
     * Envoi d'une requête à l'API de BeatSaver
     * @param url url de la requête
     * @returns résultat de la requête
     */
    static async send<T>(url: string, log: boolean = true): Promise<T> {
        let data
        let error = true
        let retries = 0

        do {
            if(log) Logger.log('BeatSaver', 'INFO', `Envoi de la requête "${url}"`)
            const res = await fetch(url)
            
            if(res.ok) {
                if(log) Logger.log('BeatSaver', 'INFO', 'Requête envoyée avec succès')
                data = await res.json()

                error = false
            } else {
                if(res.status === 404) throw Error('La ressource demandée est introuvable')
                if(res.status === 422) throw Error('La ressource demandée est introuvable')
                if(res.status === 500) {
                    Logger.log('BeatSaver', 'ERROR', 'Erreur 500, nouvel essai dans 3 secondes')
                    if(retries < 5) await wait(3)
                    retries++
                }
                if(res.status === 429) {
                    Logger.log('BeatSaver', 'ERROR', 'Erreur 429, nouvel essai dans 60 secondes')
                    await wait(60)
                }

                error = true
            }
        } while(error)

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
        } catch(error) {
            throw new BeatSaverError(`Récupération des informations de la map ${hash} depuis BeatSaver impossible : ${error.message}`)
        }
    }

    /**
     * Récupère une liste de maps en fonction de filtres
     * @param before récupère les maps avant cette date
     * @param after récupère les maps après cette date
     * @param sort méthode de tri des maps
     * @param automapper afficher les maps auto-générées
     */
    static async getMaps(before: string, after: string = '', sort: string = 'CREATED', automapper: boolean = false) {
        const args: Record<string, string> = {}
        if(before !== '') args.before = before
        if(after !== '') args.after = after
        if(sort !== '') args.sort = sort
        if(automapper) args.automapper = automapper ? 'true' : 'false'

        const params = new URLSearchParams(args).toString()
        const maps = await this.send<SearchResponse>(LATEST_MAPS_URL + `?${params}`)
        return maps
    }

    /**
     * Détermine le score maximum d'une map en fonction du nombre de notes
     * @param notes nombre de notes
     * @returns score maximum
     */
    static getMapMaxScore(notes: number) {
        let maxScore = 0
        if(notes < 14) {
            if(notes === 1) {
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
     * @param starsMin nombre d'étoiles minimum
     * @param starsMax nombre d'étoiles maximum
     * @returns liste des maps ranked
     */
    static async searchRanked(starsMin: number = 0, starsMax: number = 16) {
        const ranked = await RankedModel.findAll({
            order: [
                [ 'map.updatedAt', 'desc' ]
            ],
            raw: true
        })

        const rankedFiltered = ranked.filter(r => {
            const version = r.map.versions[r.map.versions.length - 1]
            const diffsFiltered = version.diffs.filter(d => typeof d.stars !== 'undefined' && d.stars >= starsMin && d.stars <= starsMax)
            if(diffsFiltered.length > 0) {
                version.diffs = diffsFiltered
                return true
            } else {
                return false
            }
        })

        return rankedFiltered.map(rf => rf.map)
    }

    /**
     * Récupère les dernières maps ranked puis les insert en base de données
     * @returns nombre de nouvelles maps ranked ajoutées en base de données
     */
    static async getLastRanked() {
        let newMaps = 0

        let page = new Date().toISOString()
        let end = false

        do {
            const data = await this.getMaps(page)
            const maps = data.docs
            const ranked = maps.filter(m => m.ranked)
            for(const map of ranked) {
                const exists = await RankedModel.findOne({ where: { 'map.id': map.id } })
                if(!exists) {
                    await RankedModel.create({ map: map })
                    newMaps++
                } else {
                    end = true
                }
            }
            page = maps.length > 0 ? maps[maps.length - 1].createdAt : ''
        } while(page !== null && !end)

        return newMaps
    }
}