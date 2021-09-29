const fetch = require('node-fetch')
const Logger = require('../utils/logger')
const { ScoreSaberError } = require('../utils/error')

const scoresaberUrl = 'https://scoresaber.com'
const newScoresaberUrl = 'https://new.scoresaber.com'
const newScoresaberApiUrl = newScoresaberUrl + '/api/'
const playerUrl = newScoresaberApiUrl + 'player/'

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

module.exports = {
    send: async function(url) {
        let data
        let error = true

        do {
            Logger.log(`[ScoreSaber] Envoi de la requête "${url}"`)
            const res = await fetch(url)
            
            if(res.ok) {
                Logger.log(`[ScoreSaber] Requête envoyée avec succès`)
                data = await res.json()

                error = false
            } else {
                if(res.status === 404) throw Error('La ressource demandée est introuvable')
                if(res.status === 422) throw Error('La ressource demandée est introuvable')
                if(res.status === 500) {
                    Logger.log('[ScoreSaber] [ERROR] Erreur 500, nouvel essai dans 3 secondes')
                    await wait(3)
                }
                if(res.status === 429) {
                    Logger.log('[ScoreSaber] [ERROR] Erreur 429, nouvel essai dans 30 secondes')
                    await wait(30)
                }

                error = true
            }
        } while(error)

        return data
    },

    getProfil: async function(url) {
        try {
            const player = {}

            const playerId = url.replace(/^https?:\/\/(www\.)?scoresaber\.com\/u\/([0-9]+).*$/, '$2')

            const dataProfil = await module.exports.send(playerUrl + playerId + '/full')

            const playerInfos = dataProfil.playerInfo
            player.id = playerInfos.playerId
            player.name = playerInfos.playerName
            player.avatar = newScoresaberUrl + playerInfos.avatar
            player.url = 'https://scoresaber.com/u/' + playerInfos.playerId

            return player
        } catch(error) {
            throw new ScoreSaberError(`Profil ScoreSaber introuvable. Veuillez vérifier que le lien soit valide.\n:information_source: Exemple : \`${newScoresaberUrl}/u/[Identifiant ScoreSaber]\``)
        }
    },

    getPlayerDatas: async function(playerId) {
        try {
            const player = {}

            const dataProfil = await module.exports.send(playerUrl + playerId + '/full')
            const dataScores = await module.exports.send(playerUrl + playerId + '/scores/top/1')

            const playerInfos = dataProfil.playerInfo
            const scoreStats = dataProfil.scoreStats
            player.url = 'https://scoresaber.com/u/' + playerInfos.playerId
            player.id = playerInfos.playerId
            player.name = playerInfos.playerName
            player.avatar = newScoresaberUrl + playerInfos.avatar
            player.rank = playerInfos.rank
            player.countryRank = playerInfos.countryRank
            player.pp = playerInfos.pp
            player.country = playerInfos.country
            player.history = playerInfos.history
            player.averageRankedAccuracy = scoreStats.averageRankedAccuracy

            const playerScores = dataScores.scores
            const topScore = playerScores[0]
            player.topPP = {
                rank: topScore.rank,
                score: topScore.score,
                pp: topScore.pp,
                songDetails: topScore.songAuthorName + ' - ' + topScore.songName + (topScore.songSubName != '' ? ' ' + topScore.songSubName : '') + ' [' + topScore.difficultyRaw.replace(/^_([^_]+)_.+$/, '$1').replace('ExpertPlus', 'Expert+') + '] by ' + topScore.levelAuthorName
            }

            return player
        } catch(error) {
            throw new ScoreSaberError('Une erreur est survenue lors de la récupération du profil ScoreSaber')
        }
    },

    getGlobal: async function(page) {
        try {
            const players = []

            const dataGlobal = await module.exports.send(newScoresaberApiUrl + 'players/' + page)

            const playersInfos = dataGlobal.players

            for(const playerInfos of playersInfos) {
                const player = {
                    id: playerInfos.playerId,
                    name: playerInfos.playerName,
                    country: playerInfos.country,
                    rank: playerInfos.rank,
                    pp: playerInfos.pp,
                    url: 'https://scoresaber.com/u/' + playerInfos.playerId
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
    }
}