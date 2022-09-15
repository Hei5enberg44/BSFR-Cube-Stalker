import fetch from 'node-fetch'
import beatsaver from './beatsaver.js'
import Logger from '../utils/logger.js'
import { ScoreSaberError, BeatSaverError } from '../utils/error.js'

const scoresaberUrl = 'https://scoresaber.com'
const scoresaberApiUrl = scoresaberUrl + '/api/'
const playerUrl = scoresaberApiUrl + 'player/'
const leaderboardUrl = scoresaberApiUrl + 'leaderboard/'

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

export default {
    /**
     * Envoi d'une requête à l'API de ScoreSaber
     * @param {string} url url de la requête
     * @param {boolean} log true|false pour logger la requête
     * @returns {Promise<Object>} résultat de la requête
     */
    async send(url, log = true) {
        let data
        let error = true
        let retries = 0

        do {
            if(log) Logger.log('ScoreSaber', 'INFO', `Envoi de la requête "${url}"`)
            const res = await fetch(url)
            
            if(res.ok) {
                if(log) Logger.log('ScoreSaber', 'INFO', 'Requête envoyée avec succès')
                data = await res.json()

                error = false
            } else {
                if(res.status === 400) throw Error('Erreur 400 : Requête invalide')
                if(res.status === 404) throw Error('Erreur 404 : Page introuvable')
                if(res.status === 422) throw Error('Erreur 422 : La ressource demandée est introuvable')
                if(res.status === 500) {
                    Logger.log('ScoreSaber', 'ERROR', 'Erreur 500, nouvel essai dans 3 secondes')
                    if(retries < 5) await wait(3)
                    retries++
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

    /**
     * Données de profil ScoreSaber
     * @typedef {Object} ScoreSaberProfile
     * @property {string} id
     * @property {string} name
     * @property {string} avatar
     * @property {string} url
     * @property {string} country
     * @property {number} rank
     * @property {number} pp
     * @property {boolean} banned
     * @property {boolean} inactive
     */

    /**
     * Récupération des données de profil ScoreSaber d'un joueur
     * @param {string} url lien du profil ScoreSaber du joueur
     * @returns {Promise<ScoreSaberProfile>} données de profil ScoreSaber du joueur
     */
    async getProfile(url) {
        try {
            const playerId = url.replace(/^https?:\/\/(new\.|www\.)?scoresaber\.com\/u\/([0-9]+).*$/, '$2')

            const playerInfos = await this.send(playerUrl + playerId + '/basic')

            const player = {
                id: playerInfos.id,
                name: playerInfos.name,
                avatar: playerInfos.profilePicture,
                url: `${scoresaberUrl}/u/${playerInfos.id}`,
                country: playerInfos.country,
                rank: playerInfos.rank,
                pp: playerInfos.pp,
                banned: playerInfos.banned,
                inactive: playerInfos.inactive
            }

            return player
        } catch(error) {
            throw new ScoreSaberError(`Profil ScoreSaber introuvable. Veuillez vérifier que le lien soit valide.\nℹ️ Exemple : \`${scoresaberUrl}/u/[Identifiant ScoreSaber]\``)
        }
    },

    /**
     * Informations sur la map top pp d'un joueur
     * @typedef {Object} TopPP
     * @property {number} rank
     * @property {number} pp
     * @property {number} score
     * @property {number} acc
     * @property {boolean} fc
     * @property {number} stars
     * @property {string} name
     * @property {string} difficulty
     * @property {string} author
     * @property {string} cover
     * @property {null|string} replay
     */

    /**
     * Données de joueur ScoreSaber
     * @typedef {Object} ScoreSaberPlayerDatas
     * @property {string} id
     * @property {string} name
     * @property {string} avatar
     * @property {string} url
     * @property {number} rank
     * @property {number} countryRank
     * @property {number} pp
     * @property {string} country
     * @property {string} history
     * @property {boolean} banned
     * @property {number} averageRankedAccuracy
     * @property {TopPP} topPP
     */

    /**
     * Récuparation des données ScoreSaber d'un joueur
     * @param {string} playerId identifiant ScoreSaber du joueur
     * @returns {Promise<ScoreSaberPlayerDatas>} données ScoreSaber du joueur
     */
    async getPlayerDatas(playerId) {
        try {
            const playerInfos = await this.send(playerUrl + playerId + '/full')
            const playerTopScore = await this.send(playerUrl + playerId + '/scores?sort=top&page=1&limit=1')

            const scoreStats = playerInfos.scoreStats
            const player = {
                id: playerInfos.id,
                name: playerInfos.name,
                avatar: playerInfos.profilePicture,
                url: `${scoresaberUrl}/u/${playerInfos.id}`,
                rank: playerInfos.rank,
                countryRank: playerInfos.countryRank,
                pp: playerInfos.pp,
                country: playerInfos.country,
                history: playerInfos.histories,
                banned: playerInfos.banned,
                averageRankedAccuracy: scoreStats.averageRankedAccuracy
            }

            const topScore = playerTopScore.playerScores[0]

            let mapId = null
            try {
                const mapData = await beatsaver.geMapByHash(topScore.leaderboard.songHash)
                mapId = mapData.id
            } catch(error) {
                if(error instanceof BeatSaverError) {
                    Logger.log('BeatSaver', 'WARNING', error.message)
                }
            }

            const difficulty = topScore.leaderboard.difficulty.difficultyRaw.split('_')[1]

            player.topPP = {
                rank: topScore.score.rank,
                pp: topScore.score.pp,
                score: topScore.score.modifiedScore,
                acc: topScore.score.modifiedScore / topScore.leaderboard.maxScore * 100,
                fc: topScore.score.fullCombo,
                stars: topScore.leaderboard.stars,
                name: topScore.leaderboard.songAuthorName + ' - ' + topScore.leaderboard.songName + (topScore.leaderboard.songSubName != '' ? ' ' + topScore.leaderboard.songSubName : ''),
                difficulty: difficulty,
                author: topScore.leaderboard.levelAuthorName,
                cover: topScore.leaderboard.coverImage,
                replay: topScore.score.hasReplay && mapId ? `https://www.replay.beatleader.xyz/?id=${mapId}&difficulty=${difficulty}&playerID=${player.id}` : null
            }

            return player
        } catch(error) {
            throw new ScoreSaberError('Une erreur est survenue lors de la récupération du profil ScoreSaber')
        }
    },

    /**
     * Récupération de la liste des joueurs dans le classement global de ScoreSaber
     * @param {number} page page du classement
     * @returns {Promise<Array<ScoreSaberProfile>>} liste des joueurs
     */
    async getGlobal(page) {
        try {
            const players = []

            const playersInfos = await this.send(scoresaberApiUrl + 'players?page=' + page)

            for(const playerInfos of playersInfos.players) {
                const player = {
                    id: playerInfos.id,
                    name: playerInfos.name,
                    avatar: playerInfos.profilePicture,
                    url: `${scoresaberUrl}/u/${playerInfos.id}`,
                    country: playerInfos.country,
                    rank: playerInfos.rank,
                    pp: playerInfos.pp
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
    async getPlayerRankById(scoreSaberId) {
        const playerDatas = await this.getPlayerDatas(scoreSaberId)
        return playerDatas.rank
    },

    /**
     * Récupération du classement d'un pays défini pour une map
     * @param {Number} leaderboardId identifiant du classement
     * @param {string} country pays
     * @param {Number} page page du classement
     * @returns {Promise<Array>} liste des scores du classement
     */
    async getMapCountryLeaderboard(leaderboardId, country, page = 1) {
        try {
            const datas = await this.send(leaderboardUrl + 'by-id/' + leaderboardId + '/scores?countries=' + country + '&page=' + page, false)

            return datas.scores
        } catch(error) {
            throw new ScoreSaberError('Une erreur est survenue lors de la récupération du top 1 du pays sur la map')
        }
    },

    /**
     * Données de joueur ScoreSaber
     * @typedef {Object} ScoreSaberPlayerScore
     * @property {number} rank
     * @property {number} scoreId
     * @property {number} score
     * @property {number} unmodififiedScore
     * @property {string} modifiers
     * @property {number} pp
     * @property {number} weight
     * @property {string} timeSet
     * @property {number} badCuts
     * @property {number} missedNotes
     * @property {number} maxCombo
     * @property {boolean} fullCombo
     * @property {number} leaderboardId
     * @property {string} songHash
     * @property {string} songName
     * @property {string} songSubName
     * @property {string} songAuthorName
     * @property {string} levelAuthorName
     * @property {number} difficulty
     * @property {string} difficultyRaw
     * @property {number} maxScore
     * @property {boolean} ranked
     * @property {number} stars
     */

    /**
     * Récupère la liste des scores d'un joueur par rapport à son identifiant ScoreSaber
     * @param {string} scoreSaberId identifiant ScoreSaber du joueur
     * @returns {Promise<Array.<ScoreSaberPlayerScore>>} liste des scores du joueur
     */
    async getPlayerScores(scoreSaberId) {
        const scores = []

        try {
            let nextPage = null

            do {
                const datas = await this.send(playerUrl + scoreSaberId + '/scores?sort=recent&limit=100&page=' + (nextPage ?? 1), false)
                const playerScores = datas.playerScores
                const metadata = datas.metadata

                for(const playerScore of playerScores) {
                    scores.push({
                        rank: playerScore.score.rank,
                        scoreId: playerScore.score.id,
                        score: playerScore.score.modifiedScore,
                        unmodififiedScore: playerScore.score.baseScore,
                        modifiers: playerScore.score.modifiers,
                        pp: playerScore.score.pp,
                        weight: playerScore.score.weight,
                        timeSet: playerScore.score.timeSet,
                        badCuts: playerScore.score.badCuts,
                        missedNotes: playerScore.score.missedNotes,
                        maxCombo: playerScore.score.maxCombo,
                        fullCombo: playerScore.score.fullCombo,
                        leaderboardId: playerScore.leaderboard.id,
                        songHash: playerScore.leaderboard.songHash,
                        songName: playerScore.leaderboard.songName,
                        songSubName: playerScore.leaderboard.songSubName,
                        songAuthorName: playerScore.leaderboard.songAuthorName,
                        levelAuthorName: playerScore.leaderboard.levelAuthorName,
                        difficulty: playerScore.leaderboard.difficulty.difficulty,
                        difficultyRaw: playerScore.leaderboard.difficulty.difficultyRaw,
                        maxScore: playerScore.leaderboard.maxScore,
                        ranked: playerScore.leaderboard.ranked,
                        stars: playerScore.leaderboard.stars
                    })
                }
                
                nextPage = metadata.page + 1 <= Math.ceil(metadata.total / metadata.itemsPerPage) ? metadata.page + 1 : null
            } while(nextPage)

            return scores
        } catch(error) {
            throw new ScoreSaberError('Une erreur est survenue lors de la récupération des scores du joueur')
        }
    }
}