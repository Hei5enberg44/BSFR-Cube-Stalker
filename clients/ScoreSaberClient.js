const Axios = require("axios")

const diffs = {
    "Easy": 1,
    "Normal": 3,
    "Hard": 5,
    "Expert": 7,
    "ExpertPlus": 8
}

class ScoreSaberClient {

    constructor(opt) {
        this.cookie = null
        this.config = opt.config
    }

    async login() {
        try {
            let options = {
                method: "POST",
                url: "https://scoresaber.com/game/exchange.php",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': this.config.scoresaber.userAgent,
                    'X-Unity-Version': this.config.scoresaber.unityVersion
                },
                data: "playerid=7656119000000000"
            }
            let res = await Axios(options)
            this.cookie = res.data.split("|")[1]
            return this
        } catch(e) {
            console.error(e)
        }
    }

    async getLeaderboard(levelId, difficulty) {
        try {
            let options = {
                method: "GET",
                url: "https://scoresaber.com/game/scores-pc.php",
                headers: {
                    'Accept': '*/*',
                    'User-Agent': this.config.scoresaber.userAgent,
                    'X-Unity-Version': this.config.scoresaber.unityVersion,
                    'Cookie': 'PHPSESSID=' + this.cookie
                },
                params: {
                    levelId,
                    difficulty: diffs[difficulty],
                    page: 1,
                    country: 1
                },
                data: "playerid=7656119000000000"
            }
            let res = await Axios(options)
            return res.data
        } catch(e) {
            console.error(e)
        }
    }

}

module.exports = ScoreSaberClient