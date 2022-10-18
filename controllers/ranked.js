import { Ranked } from './database.js'
import beatsaver from './beatsaver.js'

export default {
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
     * Version d'une map BeatSaver
     * @typedef {Object} BeatSaverMapVersion
     * @property {string} hash
     * @property {Array<{characteristic: string, difficulty: string}>} diffs
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
     * @property {Array<BeatSaverMapVersion>} versions
     */

    /**
     * Récupère les maps ranked en fonction de différents critères de recherche
     * @param {number} starsMin nombre d'étoiles minimum
     * @param {number} starsMax nombre d'étoiles maximum
     * @returns {Promise<Array<BeatSaverMap>>} liste des maps ranked
     */
    async search(starsMin = 0, starsMax = 14) {
        const ranked = await Ranked.findAll({
            order: [
                [ 'map.updatedAt', 'desc' ]
            ],
            raw: true
        })

        const rankedFiltered = ranked.filter(r => {
            const version = r.map.versions[0]
            const diffsFiltered = version.diffs.filter(d => typeof d.stars !== 'undefined' && d.stars >= starsMin && d.stars <= starsMax)
            if(diffsFiltered.length > 0) {
                version.diffs = diffsFiltered
                return true
            } else {
                return false
            }
        })

        return rankedFiltered.map(rf => rf.map)
    },

    /**
     * Récupère les dernières maps ranked puis les insert en base de données
     * @returns {Promise<number>} nombre de nouvelles maps ranked ajoutées en base de données
     */
    async getLastRanked() {
        let newMaps = 0

        let page = new Date().toISOString()
        let end = false

        do {
            const data = await beatsaver.getMaps(page, null, 'CREATED', false)
            const maps = data.docs
            const ranked = maps.filter(m => m.ranked)
            for(const map of ranked) {
                const exists = await Ranked.findOne({ where: { 'map.id': map.id } })
                if(!exists) {
                    await Ranked.create({ map: map })
                    newMaps++
                } else {
                    end = true
                }
            }
            page = maps.length > 0 ? maps[maps.length - 1].createdAt : null
        } while(page !== null && !end)

        return newMaps
    }
}