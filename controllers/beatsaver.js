const fetch = require('node-fetch')
const Logger = require('../utils/logger')
const { BeatSaverError } = require('../utils/error')

const beatSaverApiUrl = 'https://api.beatsaver.com/'
const mapsHashUrl = beatSaverApiUrl + '/maps/hash/'

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

module.exports = {
    send: async function(url) {
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
     * Récupération des détails d'une map en fonction d'un hash
     * @param {string} hash hash de la map
     * @returns {Object} détail de la map
     */
    geMapByHash: async function(hash) {
        try {
            const map = await module.exports.send(mapsHashUrl + hash)

            return map
        } catch(error) {
            throw new BeatSaverError(`Récupération des informations de la map depuis BeatSaver impossible : ${error.message}`)
        }
    },

    /**
     * Détermine le score maximum d'une map en fonction du nombre de notes
     * @param {Number} notes nombre de notes
     * @returns {Number} score maximum
     */
    getMapMaxScore: function(notes) {
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