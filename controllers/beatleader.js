const fetch = require('node-fetch')
const Logger = require('../utils/logger')
const { BeatLeaderError } = require('../utils/error')
const beatleaderUrl = 'https://beatleader.xyz'
const beatleaderApiUrl = 'https://api.beatleader.xyz/'
const playerUrl = beatleaderApiUrl + 'player/'
const leaderboardUrl = beatleaderApiUrl + 'leaderboard/'

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

module.exports = {
    send: async function(url, log = true) {
        let data
        let error = true

        do {
            if(log) Logger.log('BeatLeader', 'INFO', `Envoi de la requête "${url}"`)
            const res = await fetch(url)
            
            if(res.ok) {
                if(log) Logger.log('BeatLeader', 'INFO', 'Requête envoyée avec succès')
                data = await res.json()

                error = false
            } else {
                if(res.status === 404) throw Error('La ressource demandée est introuvable')
                if(res.status === 422) throw Error('La ressource demandée est introuvable')
                if(res.status === 500) {
                    Logger.log('BeatLeader', 'ERROR', 'Erreur 500, nouvel essai dans 3 secondes')
                    await wait(3)
                }
                if(res.status === 429) {
                    Logger.log('BeatLeader', 'ERROR', 'Erreur 429, nouvel essai dans 60 secondes')
                    await wait(60)
                }

                error = true
            }
        } while(error)

        return data
    },

    getProfile: async function(url) {
        try {
            const player = {}

            const playerId = url.replace(/^https?:\/\/(www\.)?beatleader\.xyz\/u\/([0-9]+).*$/, '$2')

            const playerInfos = await module.exports.send(playerUrl + playerId)

            player.id = playerInfos.id
            player.name = playerInfos.name
            player.avatar = playerInfos.avatar
            player.url = 'https://beatleader.xyz/u/' + playerInfos.id

            return player
        } catch(error) {
            throw new BeatLeaderError(`Profil BeatLeader introuvable. Veuillez vérifier que le lien soit valide.\nℹ️ Exemple : \`${beatleaderUrl}/u/[Identifiant BeatLeader]\``)
        }
    },

    getPlayerDatas: async function(playerId) {
        try {
            const player = {}

            const playerInfos = await module.exports.send(playerUrl + playerId)
            const playerTopScore = await module.exports.send(playerUrl + playerId + '/scores?sortBy=pp&page=1')

            const scoreStats = playerInfos.scoreStats
            player.url = beatleaderUrl + '/u/' + playerInfos.id
            player.id = playerInfos.id
            player.name = playerInfos.name
            player.avatar = playerInfos.avatar
            player.rank = playerInfos.rank
            player.countryRank = playerInfos.countryRank
            player.pp = playerInfos.pp
            player.country = playerInfos.country
            player.history = playerInfos.histories
            player.averageRankedAccuracy = scoreStats.averageRankedAccuracy * 100

            const topScore = playerTopScore.data[0]
            player.topPP = {
                rank: topScore.rank,
                pp: topScore.pp,
                score: topScore.modifiedScore,
                acc: topScore.accuracy * 100,
                fc: topScore.fullCombo,
                stars: topScore.leaderboard.difficulty.stars,
                name: topScore.leaderboard.song.author + ' - ' + topScore.leaderboard.song.name + (topScore.leaderboard.song.subName != '' ? ' ' + topScore.leaderboard.song.subName : ''),
                difficulty: topScore.leaderboard.difficulty.difficultyName.replace('ExpertPlus', 'Expert+'),
                author: topScore.leaderboard.song.mapper,
                cover: topScore.leaderboard.song.coverImage
            }

            return player
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du profil BeatLeader')
        }
    },

    getGlobal: async function(page) {
        try {
            const players = []

            const playersInfos = await module.exports.send(beatleaderApiUrl + 'players?page=' + page)

            for(const playerInfos of playersInfos.data) {
                const player = {
                    id: playerInfos.id,
                    name: playerInfos.name,
                    country: playerInfos.country,
                    rank: playerInfos.rank,
                    pp: playerInfos.pp,
                    url: beatleaderUrl + '/u/' + playerInfos.id
                }
                players.push(player)
            }

            return players
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du classement global')
        }
    },

    /**
     * Récupère le rang global d'un joueur par rapport à son identifiant BeatLeader
     * @param {string} beatLeaderId identifiant BeatLeader du joueur
     * @returns {Promise<number>} rang du joueur
     */
    getPlayerRankById: async function(beatLeaderId) {
        const playerDatas = await module.exports.getPlayerDatas(beatLeaderId)
        return playerDatas.rank
    },

    /**
     * Récupère les scores récent d'un joueur sur BeatLeader
     * @param {string} beatLeaderId identifiant BeatLeader du joueur
     * @param {Number} page page à récupérer
     * @returns {Promise<Object>} liste des maps
     */
    getPlayerRecentMaps: async function(beatLeaderId, page) {
        try {
            const maps = []

            const datas = await module.exports.send(playerUrl + beatLeaderId + '/scores?sort=date&page=' + page, false)

            for(const score of datas.data) {
                maps.push(score)
            }

            return maps
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération des maps récente du joueur')
        }
    },

    /**
     * Récupération du classement d'un pays défini pour une map
     * @param {Number} leaderboardId identifiant du classement
     * @param {string} country pays
     * @param {Number} page page du classement
     * @returns {Promise<Array>} liste des scores du classement
     */
    getMapCountryLeaderboard: async function(leaderboardId, country, page = 1) {
        try {
            const datas = await module.exports.send(leaderboardUrl + 'id/' + leaderboardId + '?countries=' + country + '&page=' + page, false)

            return datas.scores
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du top 1 du pays sur la map')
        }
    }
}