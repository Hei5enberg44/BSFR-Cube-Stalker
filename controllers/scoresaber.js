const fetch = require('node-fetch')
const Logger = require('../utils/logger')
const { ScoreSaberError } = require('../utils/error')
const scoresaberUrl = 'https://scoresaber.com'
const scoresaberApiUrl = scoresaberUrl + '/api/'
const playerUrl = scoresaberApiUrl + 'player/'
const leaderboardUrl = scoresaberApiUrl + 'leaderboard/'

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

module.exports = {
    send: async function(url) {
        let data
        let error = true

        do {
            Logger.log('ScoreSaber', 'INFO', `Envoi de la requête "${url}"`)
            const res = await fetch(url)
            
            if(res.ok) {
                // Logger.log('ScoreSaber', 'INFO', 'Requête envoyée avec succès')
                data = await res.json()

                error = false
            } else {
                if(res.status === 404) throw Error('La ressource demandée est introuvable')
                if(res.status === 422) throw Error('La ressource demandée est introuvable')
                if(res.status === 500) {
                    Logger.log('ScoreSaber', 'ERROR', 'Erreur 500, nouvel essai dans 3 secondes')
                    await wait(3)
                }
                if(res.status === 429) {
                    Logger.log('ScoreSaber', 'ERROR', 'Erreur 429, nouvel essai dans 60 secondes')
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

            const playerId = url.replace(/^https?:\/\/(new\.|www\.)?scoresaber\.com\/u\/([0-9]+).*$/, '$2')

            const playerInfos = await module.exports.send(playerUrl + playerId + '/basic')

            player.id = playerInfos.id
            player.name = playerInfos.name
            player.avatar = playerInfos.profilePicture
            player.url = 'https://scoresaber.com/u/' + playerInfos.id

            return player
        } catch(error) {
            throw new ScoreSaberError(`Profil ScoreSaber introuvable. Veuillez vérifier que le lien soit valide.\nℹ️ Exemple : \`${scoresaberUrl}/u/[Identifiant ScoreSaber]\``)
        }
    },

    getPlayerDatas: async function(playerId) {
        try {
            const player = {}

            const playerInfos = await module.exports.send(playerUrl + playerId + '/full')
            const playerTopScore = await module.exports.send(playerUrl + playerId + '/scores?sort=top&page=1&limit=1')

            const scoreStats = playerInfos.scoreStats
            player.url = scoresaberUrl + '/u/' + playerInfos.id
            player.id = playerInfos.id
            player.name = playerInfos.name
            player.avatar = playerInfos.profilePicture
            player.rank = playerInfos.rank
            player.countryRank = playerInfos.countryRank
            player.pp = playerInfos.pp
            player.country = playerInfos.country
            player.history = playerInfos.histories
            player.averageRankedAccuracy = scoreStats.averageRankedAccuracy

            const topScore = playerTopScore.playerScores[0]
            player.topPP = {
                rank: topScore.score.rank,
                pp: topScore.score.pp,
                acc: topScore.score.modifiedScore / topScore.leaderboard.maxScore * 100,
                fc: topScore.score.fullCombo,
                songDetails: topScore.leaderboard.songAuthorName + ' - ' + topScore.leaderboard.songName + (topScore.leaderboard.songSubName != '' ? ' ' + topScore.leaderboard.songSubName : '') + ' [' + topScore.leaderboard.difficulty.difficultyRaw.replace(/^_([^_]+)_.+$/, '$1').replace('ExpertPlus', 'Expert+') + '] by ' + topScore.leaderboard.levelAuthorName
            }

            return player
        } catch(error) {
            throw new ScoreSaberError('Une erreur est survenue lors de la récupération du profil ScoreSaber')
        }
    },

    getGlobal: async function(page) {
        try {
            const players = []

            const playersInfos = await module.exports.send(scoresaberApiUrl + 'players?page=' + page)

            for(const playerInfos of playersInfos.players) {
                const player = {
                    id: playerInfos.id,
                    name: playerInfos.name,
                    country: playerInfos.country,
                    rank: playerInfos.rank,
                    pp: playerInfos.pp,
                    url: scoresaberUrl + '/u/' + playerInfos.id
                }
                players.push(player)
            }

            return players
        } catch(error) {
            throw new ScoreSaberError('Une erreur est survenue lors de la récupération du classement global')
        }
    },

    /**
     * Récupère le rang global d'un joueur par rapport à son identifiant ScoreSaber
     * @param {string} scoreSaberId identifiant ScoreSaber du joueur
     * @returns {Promise<number>} rang du joueur
     */
    getPlayerRankById: async function(scoreSaberId) {
        const playerDatas = await module.exports.getPlayerDatas(scoreSaberId)
        return playerDatas.rank
    },

    /**
     * Récupère les scores récent d'un joueur sur ScoreSaber
     * @param {string} scoreSaberId identifiant ScoreSaber du joueur
     * @param {Number} page page à récupérer
     * @returns {Promise<Object>} liste des maps
     */
    getPlayerRecentMaps: async function(scoreSaberId, page) {
        try {
            const maps = []

            const datas = await module.exports.send(playerUrl + scoreSaberId + '/scores?sort=recent&page=' + page)

            for(const score of datas.playerScores) {
                maps.push(score)
            }

            return maps
        } catch(error) {
            throw new ScoreSaberError('Une erreur est survenue lors de la récupération des maps récente du joueur')
        }
    },

    /**
     * Récupération du top 1 d'un pays sur le classement d'une map
     * @param {Number} leaderboardId identifiant du classement
     * @param {string} country pays
     * @returns {Object} premier score du classement
     */
     getMapCountryLeaderboardTop1Player: async function(leaderboardId, country) {
        try {
            const datas = await module.exports.send(leaderboardUrl + '/by-id/' + leaderboardId + '/scores?countries=' + country + '&page=1')

            return datas.scores[0]
        } catch(error) {
            throw new ScoreSaberError('Une erreur est survenue lors de la récupération du top 1 du pays sur la map')
        }
    }
}