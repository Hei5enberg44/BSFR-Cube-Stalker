const fetch = require('node-fetch')
const Logger = require('../utils/logger')
const { BeatSaver, BeatSaverError } = require('../utils/error')

const beatsaverUrl = 'https://beatsaver.com'
const beatsaverApiUrl = beatsaverUrl + '/api'
const beatsaverMapByHash = beatsaverApiUrl + '/maps/hash/'

module.exports = {
    getMapByHash: async function(hash) {
        let data = {}

        try {
            const res = await fetch(beatsaverMapByHash + hash)

            if(res.ok) {
                data = await res.json()
            }

            return dataMap
        } catch(error) {
            return data
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