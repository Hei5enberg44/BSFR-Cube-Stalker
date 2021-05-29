const Axios = require("axios")
const Embed = new (require("../utils/Embed"))

class ScoreSaberClient {

    constructor(opt) {
        this.cookie = null
        this.config = opt.config
        this.clients = opt.clients
    }

    async login() {
        try {
            let options = {
                method: "POST",
                url: this.config.scoresaber.url + "/game/exchange.php",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': this.config.scoresaber.userAgent,
                    'X-Unity-Version': this.config.scoresaber.unityVersion
                },
                data: "playerid=76561198000000000"
            }
            let res = await Axios(options)
            this.cookie = res.data.split("|")[1]
            return this
        } catch(e) {
            console.error(e)
        }
    }

    async getLeaderboard(songID, difficulty, gameMode) {
        try {
            let options = {
                method: "GET",
                url: this.config.scoresaber.url + "/game/scores-pc.php",
                headers: {
                    'Accept': '*/*',
                    'User-Agent': this.config.scoresaber.userAgent,
                    'X-Unity-Version': this.config.scoresaber.unityVersion,
                    'Cookie': 'PHPSESSID=' + this.cookie
                },
                params: {
                    levelId: songID,
                    difficulty,
                    gameMode,
                    page: 1,
                    country: 1
                }
            }

            let res = await Axios(options)
            return res.data
        } catch(e) {
            console.error(e)
        }
    }

    async checkIfNewScoreIsFirst(info) {
        // Check if player is registered in Cubestalker
        const userDiscordId = await (await this.clients.redis.quickRedis()).get("scoresaber:" + info.playerID);

        if(!userDiscordId) return;

        let SSProfile;

        // Check if player is french
        try {
            SSProfile = await Axios.get(this.config.scoresaber.apiUrl + '/api/player/' + info.playerID + '/basic');
            SSProfile = SSProfile.data

            if(SSProfile) {
                if(SSProfile.playerInfo.country !== "FR") return;
            } else {
                console.log("ScoreSaberClient: Can't get player info")
                return;
            }
        } catch (e) {
            console.log("ScoreSaberClient: Can't reach ScoreSaber API")
            return;
        }

        // Get map details
        let map = await this.clients.beatsaver.getMapDetails(info.songID)
        if(!map) return;

        let scoreboard = await (await this.login()).getLeaderboard(info.songID, info.difficulty, "Solo" + info.gameMode)
        let isFirstFR = false

        if(scoreboard.scores.length === 0) {
            isFirstFR = true
        } else {
            if(scoreboard.scores[0].score < info.score) {
                isFirstFR = true
            }
        }

        if(isFirstFR) {
            let channel = this.clients.discord.getClient().channels.cache.get(this.config.discord.top1channel)

            let maxScore = await this.clients.beatsaver.getMaxScore(map.metadata.characteristics
                .filter((char) => char.name.toLowerCase() === info.gameMode.toLowerCase())[0]
                .difficulties[this.clients.beatsaver.diffs[info.difficulty].beatsaver].notes)
            let accuracy = ((info.score / maxScore) * 100).toFixed(2)

            let embed = Embed.embed()
            embed.setTitle(map.metadata.songName)
                .setURL(this.config.scoresaber.url + "/leaderboard/" + scoreboard.uid)
                .setThumbnail(this.config.beatsaver.url + map.coverURL)
                .setDescription("**" + this.clients.beatsaver.diffs[info.difficulty].display + "** par **" + map.metadata.levelAuthorName + "**")
                .addField("Joueur", "<@" + userDiscordId + ">", true)
                .addField("ScoreSaber", "[" + SSProfile.playerInfo.playerName + "](" + this.config.scoresaber.url + "/u/" + info.playerID + ")", true)
                .addField("\u200b", "\u200b", true)
                .addField("Score", info.score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), true)
                .addField("Précision", accuracy + "%", true)
                .addField("\u200b", "\u200b", true)
                .addField("BeatSaver", "[Lien](" + this.config.beatsaver.url + "/beatmap/" + map.key + ")", true)
                .addField("BSR", "!bsr " + map.key, true)
                .addField("\u200b", "\u200b", true)
                .setColor("#FFAC33")

            channel.send(embed)
        }
    }
}

module.exports = ScoreSaberClient