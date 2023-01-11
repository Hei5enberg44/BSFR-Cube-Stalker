import fetch from 'node-fetch'
import Logger from '../utils/logger.js'
import { BeatLeaderError } from '../utils/error.js'

const beatleaderUrl = 'https://beatleader.xyz'
const beatleaderApiUrl = 'https://api.beatleader.xyz/'
const playerUrl = beatleaderApiUrl + 'player/'
const leaderboardUrl = beatleaderApiUrl + 'leaderboard/'

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

export default {
    /**
     * Envoi d'une requête à l'API de BeatLeader
     * @param {string} url url de la requête
     * @param {boolean} log true|false pour logger la requête
     * @returns {Promise<Object>} résultat de la requête
     */
    async send(url, log = true) {
        let data
        let error = true
        let retries = 0

        do {
            if(log) Logger.log('BeatLeader', 'INFO', `Envoi de la requête "${url}"`)
            const res = await fetch(url)
            
            if(res.ok) {
                if(log) Logger.log('BeatLeader', 'INFO', 'Requête envoyée avec succès')
                data = await res.json()

                error = false
            } else {
                if(res.status === 401) throw Error(`Erreur 401 : ${await res.text()}`)
                if(res.status === 404) throw Error('Erreur 404 : Page introuvable')
                if(res.status === 422) throw Error('Erreur 422 : La ressource demandée est introuvable')
                if(res.status === 500) {
                    Logger.log('BeatLeader', 'ERROR', 'Erreur 500, nouvel essai dans 3 secondes')
                    if(retries < 5) await wait(3)
                }
                if(res.status === 429) {
                    Logger.log('BeatLeader', 'ERROR', 'Erreur 429, nouvel essai dans 60 secondes')
                    await wait(60)
                }

                error = true
                retries++
            }
        } while(error)

        return data
    },

    /**
     * Données de profil BeatLeader
     * @typedef {Object} BeatLeaderProfile
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
     * Récupération des données de profil BeatLeader d'un joueur
     * @param {string} url lien du profil BeatLeader du joueur
     * @returns {Promise<BeatLeaderProfile>} données de profil BeatLeader du joueur
     */
    async getProfile(url) {
        try {
            const playerId = url.replace(/^https?:\/\/(www\.)?beatleader\.xyz\/u\/([0-9]+).*$/, '$2')

            const playerInfos = await this.send(playerUrl + playerId)

            const player = {
                id: playerInfos.id,
                name: playerInfos.name,
                avatar: playerInfos.avatar,
                url: `${beatleaderUrl}/u/${playerInfos.id}`,
                country: playerInfos.country,
                rank: playerInfos.rank,
                pp: playerInfos.pp,
                banned: playerInfos.banned,
                inactive: playerInfos.inactive
            }

            return player
        } catch(error) {
            throw new BeatLeaderError(`Profil BeatLeader introuvable. Veuillez vérifier que le lien soit valide.\nℹ️ Exemple : \`${beatleaderUrl}/u/[Identifiant BeatLeader]\``)
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
     * Données de joueur BeatLeader
     * @typedef {Object} BeatLeaderPlayerData
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
     * Récuparation des données BeatLeader d'un joueur
     * @param {string} playerId identifiant BeatLeader du joueur
     * @returns {Promise<BeatLeaderPlayerData>} données BeatLeader du joueur
     */
    async getPlayerData(playerId) {
        try {
            const playerInfos = await this.send(playerUrl + playerId)
            const playerTopScore = await this.send(playerUrl + playerId + '/scores?sortBy=pp&page=1')

            const scoreStats = playerInfos.scoreStats
            const player = {
                id: playerInfos.id,
                name: playerInfos.name,
                avatar: playerInfos.avatar,
                url: `${beatleaderUrl}/u/${playerInfos.id}`,
                rank: playerInfos.rank,
                countryRank: playerInfos.countryRank,
                pp: playerInfos.pp,
                country: playerInfos.country,
                history: playerInfos.histories,
                banned: playerInfos.banned,
                averageRankedAccuracy: scoreStats.averageRankedAccuracy * 100
            }

            const topScore = playerTopScore.data[0]

            const difficulty = topScore.leaderboard.difficulty.difficultyName

            player.topPP = {
                rank: topScore.rank,
                pp: topScore.pp,
                score: topScore.modifiedScore,
                acc: topScore.accuracy * 100,
                fc: topScore.fullCombo,
                stars: topScore.leaderboard.difficulty.stars,
                name: topScore.leaderboard.song.author + ' - ' + topScore.leaderboard.song.name + (topScore.leaderboard.song.subName != '' ? ' ' + topScore.leaderboard.song.subName : ''),
                difficulty: difficulty,
                author: topScore.leaderboard.song.mapper,
                cover: topScore.leaderboard.song.coverImage,
                replay: `https://www.replay.beatleader.xyz/?id=${topScore.leaderboard.song.id}&difficulty=${difficulty}&playerID=${player.id}`
            }

            return player
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du profil BeatLeader')
        }
    },

    /**
     * Récupération de la liste des joueurs dans le classement global de BeatLeader
     * @param {number} page page du classement
     * @returns {Promise<Array<BeatLeaderProfile>>} liste des joueurs
     */
    async getGlobal(page) {
        try {
            const players = []

            const playersInfos = await this.send(beatleaderApiUrl + 'players?page=' + page)

            for(const playerInfos of playersInfos.data) {
                const player = {
                    id: playerInfos.id,
                    name: playerInfos.name,
                    avatar: playerInfos.avatar,
                    url: `${beatleaderUrl}/u/${playerInfos.id}`,
                    country: playerInfos.country,
                    rank: playerInfos.rank,
                    pp: playerInfos.pp
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
    async getPlayerRankById(beatLeaderId) {
        const playerData = await this.getPlayerData(beatLeaderId)
        return playerData.rank
    },

    /**
     * Récupération du classement d'un pays défini pour une map
     * @param {number} leaderboardId identifiant du classement
     * @param {string} country pays
     * @param {number} page page du classement
     * @returns {Promise<Array>} liste des scores du classement
     */
    async getMapCountryLeaderboard(leaderboardId, country, page = 1) {
        try {
            const data = await this.send(leaderboardUrl + 'id/' + leaderboardId + '?countries=' + country + '&page=' + page, false)

            return data.scores
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du top 1 du pays sur la map')
        }
    },

    /**
     * Données de joueur ScoreSaber
     * @typedef {Object} BeatLeaderPlayerScore
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
     * Récupère la liste des scores d'un joueur par rapport à son identifiant BeatLeader
     * @param {string} beatLeaderId identifiant BeatLeader du joueur
     * @returns {Promise<Array.<BeatLeaderPlayerScore>>} liste des scores du joueur
     */
     async getPlayerScores(beatLeaderId) {
        const scores = []

        try {
            let nextPage = null

            do {
                const data = await this.send(playerUrl + beatLeaderId + '/scores?sortBy=date&order=desc&count=100&page=' + (nextPage ?? 1), false)
                const playerScores = data.data
                const metadata = data.metadata

                for(const playerScore of playerScores) {
                    scores.push({
                        rank: playerScore.rank,
                        scoreId: playerScore.id,
                        score: playerScore.modifiedScore,
                        unmodififiedScore: playerScore.baseScore,
                        modifiers: playerScore.modifiers,
                        pp: playerScore.pp,
                        weight: playerScore.weight,
                        timeSet: playerScore.timeset,
                        badCuts: playerScore.badCuts,
                        missedNotes: playerScore.missedNotes,
                        maxCombo: playerScore.maxCombo,
                        fullCombo: playerScore.fullCombo,
                        leaderboardId: playerScore.leaderboard.id,
                        songHash: playerScore.leaderboard.song.hash,
                        songName: playerScore.leaderboard.song.name,
                        songSubName: playerScore.leaderboard.song.subName,
                        songAuthorName: playerScore.leaderboard.song.author,
                        levelAuthorName: playerScore.leaderboard.song.mapper,
                        difficulty: playerScore.leaderboard.difficulty.value,
                        difficultyRaw: playerScore.leaderboard.difficulty.difficultyName,
                        maxScore: playerScore.leaderboard.difficulty.maxScore,
                        ranked: playerScore.leaderboard.difficulty.stars ? true : false,
                        stars: playerScore.leaderboard.difficulty.stars
                    })
                }
                
                nextPage = metadata.page + 1 <= Math.ceil(metadata.total / metadata.itemsPerPage) ? metadata.page + 1 : null
            } while(nextPage)

            return scores
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération des scores du joueur')
        }
    },

    /**
     * Récupère les maps ranked en fonction de différents critères de recherche
     * @param {number} starsMin nombre d'étoiles minimum
     * @param {number} starsMax nombre d'étoiles maximum
     * @returns {Promise<Array>} liste des maps ranked
     */
    async searchRanked(starsMin = 0, starsMax = 16) {
        const playlist = await this.send(beatleaderApiUrl + 'playlist/generate?count=2000&stars_from=' + starsMin + '&stars_to=' + starsMax, false)
        if(playlist) return playlist.songs
        return []
    }
}