const Axios = require("axios")

class BeatSaverClient {

    constructor(opt) {
        this.config = opt.config
    }

    async getMapDetails(hash) {
        try {
            let options = {
                method: "GET",
                url: this.config.beatsaver.apiUrl + "/maps/hash/" + hash,
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
        let maxScore

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
                "beatsaver": "Easy",
                "display": "Easy"
            },
            3: {
                "beatsaver": "Normal",
                "display": "Normal"
            },
            5: {
                "beatsaver": "Hard",
                "display": "Hard"
            },
            7: {
                "beatsaver": "Expert",
                "display": "Expert"
            },
            9: {
                "beatsaver": "ExpertPlus",
                "display": "Expert+"
            },
        }
    }
}

module.exports = BeatSaverClient