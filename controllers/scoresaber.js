const fetch = require('node-fetch')
const FormData = require('form-data')
const Logger = require('../utils/logger')
const Database = require('./database')
const members = require('./members')
const beatsaver = require('./beatsaver')
const config = require('../config.json')
const { ScoreSaberError, BeatSaverError } = require('../utils/error')

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

            const playerId = url.replace(/^https?:\/\/(new\.|www\.)?scoresaber\.com\/u\/([0-9]+).*$/, '$2')

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

    /**
     * Récupère les dernières maps jouées d'un joueur puis ajoute la dernière map jouée en base
     * @param {string} playerId identifiant ScoreSaber du joueur
     * @returns {Promise<Object[]>} dernières maps jouée du joueur
     */
    getLastsPlayerScores: async function(playerId) {
        const client = new Database()

        try {
            const db = await client.connect()
            const m = db.collection('maps')

            let page = 1
            let error = false

            const newMaps = []

            do {
                try {
                    const dataScores = await module.exports.send(playerUrl + playerId + '/scores/recent/' + page)

                    for(const userScore of dataScores.scores) {
                        userScore.playerId = playerId

                        const score = await m.findOne({
                            playerId: userScore.playerId,
                            songHash: userScore.songHash,
                            difficultyRaw: userScore.difficultyRaw
                        })

                        if(!score) {
                            newMaps.push(userScore)
                        } else {
                            if(score.score != userScore.score || score.pp != userScore.pp) {
                                newMaps.push(userScore)
                            } else {
                                error = true
                                break
                            }
                        }
                    }

                    page++
                } catch(err) {
                    error = true
                }
            } while(!error)

            if(newMaps.length > 0) {
                await m.deleteMany({
                    playerId: playerId
                })

                await m.insertOne(newMaps[0])
            }

            return newMaps
        } finally {
            client.close()
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
    },

    /**
     * Autentification au mod ScoreSaber
     * @returns {Promise<{nonce: string, phpSessionId: string}>}
     */
    authenticate: async function() {
        const auth = {
            nonce: '',
            phpSessionId: ''
        }

        const client = new Database()

        try {
            const db = await client.connect()
            const s = db.collection('scoresaber')

            const ss = await s.find().toArray()

            if(ss.length === 0 || (ss.length > 0 && !await module.exports.nonceIsValid(ss[0].nonce))) {
                const nonce = await module.exports.getNonce()
                phpSessionId = await module.exports.getPhpSessionId(nonce)

                await s.deleteMany()
                await s.insertOne({
                    nonce: nonce,
                    phpsessid: phpSessionId
                })

                auth.nonce = nonce
                auth.phpSessionId = phpSessionId
            } else {
                auth.nonce = ss[0].nonce
                auth.phpSessionId = ss[0].phpsessid
            }

            return auth
        } catch(error) {
            throw Error(error.message)
        } finally {
            client.close()
        }
    },

    /**
     * Vérifie si le dernier ticket nonce généré est toujours valide
     * @param {string} nonce dernier ticket nonce généré
     * @returns {Promise<Boolean>}
     */
    nonceIsValid: async function(nonce) {
        try {
            const key = config.scoresaber.key
            const appid = config.scoresaber.appid
            const ticket = nonce

            const steamApiUrl = `https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1/?key=${key}&appid=${appid}&ticket=${ticket}`

            const options = { method: 'GET' }

            const res = await fetch(steamApiUrl, options)
            const data = await res.json()

            const nonceIsValid = data.response.error ? false : true

            return nonceIsValid
        } catch(error) {
            throw new Error('Une erreur est survenue lors de la vérification du ticket nonce')
        }
    },

    /**
     * Récupération d'un ticket nonce
     * @returns {Promise<string>} ticket nonce
     */
    getNonce: async function() {
        try {
            const nonceApiUrl = config.nonceapiurl

            const options = { method: 'GET' }

            const res = await fetch(nonceApiUrl, options)

            const data = await res.json()

            return data[0]
        } catch(error) {
            throw Error('Une erreur est survenue lors de la récupération d\'un nouveau ticket nonce')
        }
    },

    /**
     * Récupère le cookie PHPSESSID en s'identifiant à ScoreSaber
     * @param {string} nonce ticket nonce
     * @returns {Promise<string>} cookie PHPSESSID
     */
    getPhpSessionId: async function(nonce) {
        try {
            try {
                const scoreSaberAuthUrl = 'https://scoresaber.com/game/exchange.php'

                const formData = new FormData()
                formData.append('playerid', '00000000000000001')
                formData.append('at', '1')
                formData.append('nonce', nonce)

                const options = {
                    method: 'POST',
                    headers: {
                        'Accept-Encoding': 'identity',
                        'User-Agent': 'ScoreSaber-PC/3.1.10.0',
                        'Accept': '*/*'
                    },
                    body: formData
                }

                const res = await fetch(scoreSaberAuthUrl, options)

                const data = await res.text()

                if(data.includes('Failed to authenticate')) {
                    throw new ScoreSaberError('Échec de l\'autentification au mod ScoreSaber')
                }
    
                const phpSessionId = data.split('|')[1]
    
                return phpSessionId
            } catch(error) {
                if(error instanceof ScoreSaberError) {
                    throw Error(error.message)
                } else {
                    throw Error('Une erreur est survenue lors de l\'autentification au mod ScoreSaber')
                }
            }
        } catch(error) {
            throw Error(error.message)
        }
    },

    getCountryLeaderboard: async function(levelId, levelDifficulty, levelGameMode) {
        try {
            const auth = await module.exports.authenticate()

            try {
                const leaderBoardApiUrl = `https://scoresaber.com/game/scores-pc.php?levelId=${levelId}&difficulty=${levelDifficulty}&gameMode=${levelGameMode}&page=1&country=1`
            
                const options = {
                    method: 'GET',
                    headers: {
                        'Accept-Encoding': 'identity',
                        'Accept': '*/*',
                        'Cookie': `PHPSESSID=${auth.phpSessionId}`
                    }
                }

                const res = await fetch(leaderBoardApiUrl, options)

                const data = await res.json()

                if(!data.uid) {
                    throw new ScoreSaberError(`Aucune donnée de classement France pour la map "${levelId}"`)
                }
            
                return data
            } catch(error) {
                if(error instanceof ScoreSaberError) {
                    throw Error(error.message)
                } else {
                    throw Error(`Une erreur est survenue lors de la récupération du classement France pour la map "${levelId}" : ${error.message}`)
                }
            }
        } catch(error) {
            throw Error(error.message)
        }
    },

    /**
     * Récupère les dernières maps jouées de tous les membres du Discord
     * @returns {Promise<Object[]>} liste des maps
     */
    getTop1FR: async function() {
        try {
            const top1FR = []
            
            const membersList = await members.getAllMembers()

            for(const m of membersList) {
                const lastsMaps = await module.exports.getLastsPlayerScores(m.scoreSaberId)

                for(const map of lastsMaps) {
                    const difficultyRaw = (map.difficultyRaw).split('_')[2]
                    const countryLeaderboard = await module.exports.getCountryLeaderboard(map.songHash, map.difficulty, difficultyRaw)

                    const top1 = countryLeaderboard.scores[0]
                    if(top1.playerId === m.scoreSaberId) {
                        top1FR.push({
                            memberId: m.memberId,
                            leaderboardUrl: scoresaberUrl + '/leaderboard/' + countryLeaderboard.uid,
                            playerInfos: await module.exports.getProfil(m.scoreSaberId),
                            difficultyRaw: map.difficultyRaw,
                            mapInfos: await beatsaver.getMapByHash(map.songHash),
                            scoreInfos: top1
                        })
                    }
                }
            }

            return top1FR
        } catch(error) {
            throw Error(error.message)
        }
    }
}