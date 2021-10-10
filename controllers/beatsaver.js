const fetch = require('node-fetch')
const Logger = require('../utils/logger')
const { BeatSaver, BeatSaverError } = require('../utils/error')

const beatsaverUrl = 'https://beatsaver.com'
const beatsaverApiUrl = beatsaverUrl + '/api'
const beatsaverMapByHash = beatsaverApiUrl + '/maps/hash/'

module.exports = {
    send: async function(url) {
        let data
        let error = true

        do {
            Logger.log(`[BeatSaver] Envoi de la requête "${url}"`)
            const res = await fetch(url)
            
            if(res.ok) {
                Logger.log(`[BeatSaver] Requête envoyée avec succès`)
                data = await res.json()

                error = false
            } else {
                if(res.status === 404) throw Error('La ressource demandée est introuvable')

                error = true
            }
        } while(error)

        return data
    },

    getMapByHash: async function(hash) {
        try {
            const dataMap = await module.exports.send(beatsaverMapByHash + hash)

            return dataMap
        } catch(error) {
            throw new BeatSaverError(`Map "${hash}" introuvable`)
        }
    },

    getMaxScore: function(notes) {
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