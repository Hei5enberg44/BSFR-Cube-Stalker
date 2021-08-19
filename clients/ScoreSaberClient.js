const Axios = require("axios")
const Embed = new (require("../utils/Embed"))
let retry = 0

class ScoreSaberClient {

    constructor(opt) {
        this.cookie = null
        this.config = opt.config
        this.clients = opt.clients
    }

    async getNonce() {
        try {
            let options = {
                method: "GET",
                url: this.config.ingameapi.apiUrl + "/api/nonce",
                headers: {
                    'User-Agent': this.config.ingameapi.userAgent
                }
            }
            let res = await Axios(options)
            return res.data[0]
        } catch(e) {
            console.error(e)
        }
    }

    async deleteNonce() {
        try {
            let options = {
                method: "DELETE",
                url: this.config.ingameapi.apiUrl + "/api/nonce",
                headers: {
                    'User-Agent': this.config.ingameapi.userAgent
                }
            }
            await Axios(options)
            return this
        } catch(e) {
            console.error(e)
        }
    }

    async login() {
        let nonce = await this.getNonce();
        try {
            let options = {
                method: "POST",
                url: this.config.scoresaber.url + "/game/exchange.php",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': this.config.scoresaber.userAgent,
                    'X-Unity-Version': this.config.scoresaber.unityVersion
                },
                data: "playerid=" + this.config.scoresaber.steamUserId + "&at=1&" + "nonce=" + nonce
            }
            let res = await Axios(options)
            if(res.data === "Failed to authenticate" && retry < 3) {
                console.log(res.data)
                await this.deleteNonce()
                await this.sleep(2000)
                this.cookie = false
                retry++;
                this.login()
            } else {
                this.cookie = res.data.split("|")[1]
                retry = 0;
            }

            if(retry === 2) {
                retry = 0;
            }

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
        // If no cookie, just return
        if(!this.cookie || !info["isAPass"]) return;

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

            let maxScore = await this.clients.beatsaver.getMaxScore(
                map.versions[0].diffs.filter((diff) => diff.characteristic.toLowerCase() === info.gameMode.toLowerCase() && diff.difficulty.toLowerCase() === this.clients.beatsaver.diffs[info.difficulty].beatsaver)[0].notes
            )

            let accuracy = ((info.score / maxScore) * 100).toFixed(2)

            let embed = Embed.embed()
            await embed.setTitle(map.name)
                .setURL(this.config.scoresaber.url + "/leaderboard/" + scoreboard.uid)
                .setThumbnail(this.config.beatsaver.url + map.versions[0].coverURL)
                .setDescription("**" + this.clients.beatsaver.diffs[info.difficulty].display + "** par **" + map.metadata.levelAuthorName + "**")
                .addField("Joueur", "<@" + userDiscordId + ">", true)
                .addField("ScoreSaber", "[" + SSProfile.playerInfo.playerName + "](" + this.config.scoresaber.url + "/u/" + info.playerID + ")", true)
                .addField("\u200b", "\u200b", true)
                .addField("Score", info.score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), true)
                .addField("Précision", accuracy + "%", true)
                .addField("\u200b", "\u200b", true)
                .addField("BeatSaver", "[Lien](" + this.config.beatsaver.url + "/beatmap/" + map.id + ")", true)
                .addField("BSR", "!bsr " + map.id, true)
                .addField("\u200b", "\u200b", true)
                .setColor("#FFAC33")

            channel.send({embeds: [embed]})
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

module.exports = ScoreSaberClient