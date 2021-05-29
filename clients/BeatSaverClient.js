const Axios = require("axios")

class BeatSaverClient {

    constructor(opt) {
        this.config = opt.config
    }

    async getMapDetails(hash) {
        try {
            let options = {
                method: "GET",
                url: this.config.beatsaver.apiUrl + "/maps/by-hash/" + hash,
                headers: {
                    'User-Agent': this.config.beatsaver.userAgent
                }
            }
            let res = await Axios(options)
            return res.data
        } catch(e) {
            console.error("BeatSaverClient: Can't reach BeatSaver API")
            return null
        }
    }

    async getMaxScore(notes) {
        let maxScore = 0

        if(notes < 14) {
            if(notes === 1) {
                maxScore = 115;
            } else if (notes < 5) {
                maxScore = (notes - 1) * 230 + 115;
            } else {
                maxScore = (notes - 5) * 460 + 1035;
            }
        } else {
            maxScore = (notes - 13) * 920 + 4715;
        }

        return maxScore
    }

    get diffs() {
        return {
            1: {
                "beatsaver": "easy",
                "display": "Easy"
            },
            3: {
                "beatsaver": "normal",
                "display": "Normal"
            },
            5: {
                "beatsaver": "hard",
                "display": "Hard"
            },
            7: {
                "beatsaver": "expert",
                "display": "Expert"
            },
            9: {
                "beatsaver": "expertPlus",
                "display": "Expert+"
            },
        }
    }
}

module.exports = BeatSaverClient