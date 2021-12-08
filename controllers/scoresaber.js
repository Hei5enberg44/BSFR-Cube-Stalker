const fetch = require('node-fetch')
const Logger = require('../utils/logger')
const Database = require('./database')
const { ScoreSaberError } = require('../utils/error')

const scoresaberUrl = 'https://scoresaber.com'
const scoresaberApiUrl = scoresaberUrl + '/api/'
const playerUrl = scoresaberApiUrl + 'player/'

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

module.exports = {
    send: async function(url) {
        let data
        let error = true

        do {
            // Logger.log('ScoreSaber', 'INFO', `Envoi de la requête "${url}"`)
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
            throw new ScoreSaberError(`Profil ScoreSaber introuvable. Veuillez vérifier que le lien soit valide.\n:information_source: Exemple : \`${scoresaberUrl}/u/[Identifiant ScoreSaber]\``)
        }
    },

    getPlayerDatas: async function(playerId) {
        try {
            const player = {}

            const playerInfos = await module.exports.send(playerUrl + playerId + '/full')
            const playerScores = await module.exports.send(playerUrl + playerId + '/scores?sort=top&page=1')

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

            const topScore = playerScores[0]
            player.topPP = {
                rank: topScore.score.rank,
                score: topScore.score.modifiedScore,
                pp: topScore.score.pp,
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

            for(const playerInfos of playersInfos) {
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
     * Récupère les top 1 FR depuis la base de données
     * @returns {Promise<Object[]>} liste des maps
     */
    getTop1FR: async function() {
        const client = new Database()

        try {
            const db = await client.connect()
            const t = db.collection('top1')

            const top1FR = await t.find().toArray()

            return top1FR
        } finally {
            client.close()
        }
    },

    /**
     * Supprime un top 1 FR de la base de données
     * @param {Object} top1 données du top 1 à supprimer
     */
    deleteTop1FR: async function(top1) {
        const client = new Database()

        try {
            const db = await client.connect()
            const t = db.collection('top1')

            await t.deleteOne({
                scoreSaberId: top1.scoreSaberId,
                memberId: top1.memberId,
                leaderboardId: top1.leaderboardId,
                score: top1.score,
                pp: top1.pp
            })
        } finally {
            client.close()
        }
    }
}