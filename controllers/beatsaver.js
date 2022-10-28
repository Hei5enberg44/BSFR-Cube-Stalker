import fetch from 'node-fetch'
import Logger from '../utils/logger.js'
import { BeatSaverError } from '../utils/error.js'

const beatSaverApiUrl = 'https://api.beatsaver.com/'
const mapsHashUrl = beatSaverApiUrl + '/maps/hash/'
const latestMapsUrl = beatSaverApiUrl + '/maps/latest'

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

export default {
    /**
     * Envoi d'une requête à l'API de BeatSaver
     * @param {string} url url de la requête
     * @returns {Promise<Object>} résultat de la requête
     */
    async send(url) {
        let data
        let error = true

        do {
            const res = await fetch(url)
            
            if(res.ok) {
                data = await res.json()

                error = false
            } else {
                if(res.status === 404) throw Error('La ressource demandée est introuvable')
                if(res.status === 422) throw Error('La ressource demandée est introuvable')
                if(res.status === 500) {
                    Logger.log('BeatSaver', 'ERROR', 'Erreur 500, nouvel essai dans 3 secondes')
                    await wait(3)
                }
                if(res.status === 429) {
                    Logger.log('BeatSaver', 'ERROR', 'Erreur 429, nouvel essai dans 60 secondes')
                    await wait(60)
                }

                error = true
            }
        } while(error)

        return data
    },

    /**
     * Metadonnées d'une map BeatSaver
     * @typedef {Object} BeatSaverMapMetadata
     * @property {number} duration
     * @property {string} levelAuthorName
     * @property {string} songAuthorName
     * @property {string} songName
     * @property {string} songSubName
     */

    /**
     * Map BeatSaver
     * @typedef {Object} BeatSaverMap
     * @property {string} id
     * @property {string} description
     * @property {string} name
     * @property {boolean} qualified
     * @property {boolean} ranked
     * @property {BeatSaverMapMetadata} metadata
     */

    /**
     * Récupération des détails d'une map en fonction d'un hash
     * @param {string} hash hash de la map
     * @returns {Promise<BeatSaverMap>} détail de la map
     */
    async getMapByHash(hash) {
        try {
            const map = await this.send(mapsHashUrl + hash)

            return map
        } catch(error) {
            throw new BeatSaverError(`Récupération des informations de la map depuis BeatSaver impossible : ${error.message}`)
        }
    },

    /**
     * Récupère une liste de maps en fonction de filtres
     * @param {string} before récupère les maps avant cette date
     * @param {string} after récupère les maps après cette date
     * @param {string} sort méthode de tri des maps
     * @param {boolean} automapper afficher les maps auto-générées
     */
    async getMaps(before, after, sort = 'CREATED', automapper = false) {
        const args = {}
        if(before) args.before = before
        if(after) args.after = after
        if(sort) args.sort = sort
        if(automapper) args.automapper = automapper

        const params = new URLSearchParams(args).toString()
        const maps = await this.send(latestMapsUrl + `?${params}`, {
            method: 'GET'
        })
        return maps
    },

    /**
     * Détermine le score maximum d'une map en fonction du nombre de notes
     * @param {number} notes nombre de notes
     * @returns {Number} score maximum
     */
    getMapMaxScore(notes) {
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
}