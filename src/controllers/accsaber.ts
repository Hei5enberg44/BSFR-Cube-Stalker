import { PlayerModel } from '../models/player.model.js'
import { PlayerData, PlayerScore } from '../interfaces/player.interface.js'
import { AccSaberPlayerScoresModel } from '../models/playerScores.model.js'
import { Leaderboards } from './gameLeaderboard.js'
import Logger from '../utils/logger.js'
import { AccSaberError } from '../utils/error.js'

const ACCSABER_URL = 'https://accsaber.com'
const ACCSABER_API_URL = 'https://gql.accsaber.com/graphql'

const wait = (s: number) => new Promise((res) => setTimeout(res, s * 1000))

export default class AccSaber {
    /**
     * Envoi d'une requête à l'API de AccSaber
     * @param query contenu de la requête
     * @param log true|false pour logger la requête
     * @returns résultat de la requête
     */
    private static async send<T>(
        query: string,
        log: boolean = false
    ): Promise<T> {
        let data
        let error = false
        let retries = 0

        do {
            if (log)
                Logger.log(Leaderboards.AccSaber, 'INFO', `Envoi de la requête "${query}"`)
            const res = await fetch(ACCSABER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    query
                })
            })

            if (res.ok) {
                if (log)
                    Logger.log(
                        Leaderboards.AccSaber,
                        'INFO',
                        'Requête envoyée avec succès'
                    )
                data = await res.json()

                error = false
            } else {
                if (res.status === 401)
                    throw Error(`Erreur 400 : ${await res.text()}`)
                if (res.status === 401)
                    throw Error(`Erreur 401 : ${await res.text()}`)
                if (res.status === 404)
                    throw Error('Erreur 404 : Page introuvable')
                if (res.status === 422)
                    throw Error(
                        'Erreur 422 : La ressource demandée est introuvable'
                    )
                if (res.status === 500) {
                    Logger.log(
                        Leaderboards.AccSaber,
                        'ERROR',
                        'Erreur 500, nouvel essai dans 3 secondes'
                    )
                    if (retries < 5) {
                        await wait(3)
                        retries++
                    } else {
                        throw Error('Erreur 500 : Erreur interne du serveur')
                    }
                }
                if (res.status === 429) {
                    Logger.log(
                        Leaderboards.AccSaber,
                        'ERROR',
                        'Erreur 429, nouvel essai dans 60 secondes'
                    )
                    await wait(60)
                }

                error = true
            }
        } while (error)

        return data
    }

    /**
     * Récupération des données de profil AccSaber d'un joueur
     * @param url lien du profil AccSaber du joueur
     * @returns données de profil AccSaber du joueur
     */
    static async getPlayerDataByUrl(url: string) {
        try {
            const playerId = url.replace(
                /^https?:\/\/(?:www\.)?accsaber\.com\/profile\/([0-9]+).*$/,
                '$1'
            )
            const playerData = await this.getPlayerData(playerId)
            return playerData
        } catch (error) {
            throw new AccSaberError(
                `Profil AccSaber introuvable. Veuillez vérifier que le lien soit valide.\nℹ️ Exemple : \`${ACCSABER_URL}/profile/[Identifiant AccSaber]\``
            )
        }
    }

    /**
     * Récuparation des données AccSaber d'un joueur
     * @param playerId identifiant AccSaber du joueur
     * @returns données AccSaber du joueur
     */
    static async getPlayerData(playerId: string): Promise<PlayerData> {
        try {
            const playerRequest = await this.send<{
                data: {
                    overallAccSaberPlayers: {
                        nodes: {
                            ap: number
                            avatarUrl: string
                            averageAcc: number
                            playerId: string
                            playerName: string
                            ranking: string
                        }[]
                    }
                    accSaberScores: {
                        nodes: {
                            accuracy: number
                            ap: number
                            complexity: number
                            difficulty: string
                            levelAuthorName: string
                            ranking: string
                            score: number
                            songAuthorName: string
                            songHash: string
                            songName: string
                            songSubName: string
                        }[]
                    }
                }
            }>(`\
                {\
                    overallAccSaberPlayers(\
                        condition: {playerId: \"${playerId}\"}\
                    ) {\
                        nodes {\
                            ap\
                            averageAcc\
                            avatarUrl\
                            playerId\
                            playerName\
                            ranking\
                        }\
                    }\
                    accSaberScores(\
                        condition: {playerId: \"${playerId}\", isRankedScore: true}\
                        orderBy: AP_DESC\
                        first: 1\
                    ) {\
                        nodes {\
                            accuracy\
                            ap\
                            complexity\
                            difficulty\
                            levelAuthorName\
                            ranking\
                            score\
                            songAuthorName\
                            songHash\
                            songName\
                            songSubName\
                        }\
                    }\
                }\
            `)
            const playerInfos = playerRequest.data.overallAccSaberPlayers.nodes
                .length
                ? playerRequest.data.overallAccSaberPlayers.nodes[0]
                : null
            if (!playerInfos)
                throw new AccSaberError("Ce profil AccSaber n'existe pas")

            const playerTopScore = playerRequest.data.accSaberScores.nodes
                .length
                ? playerRequest.data.accSaberScores.nodes[0]
                : null

            let topAP = null
            if (playerTopScore) {
                topAP = {
                    rank: parseInt(playerTopScore.ranking),
                    points: playerTopScore.ap,
                    score: playerTopScore.score,
                    acc: playerTopScore.accuracy * 100,
                    fc: true,
                    rating: playerTopScore.complexity,
                    name:
                        playerTopScore.songAuthorName +
                        ' - ' +
                        playerTopScore.songName +
                        (playerTopScore.songSubName !== ''
                            ? ' ' + playerTopScore.songSubName
                            : ''),
                    difficulty: playerTopScore.difficulty,
                    author: playerTopScore.levelAuthorName,
                    cover: `https://cdn.beatsaver.com/${playerTopScore.songHash}.jpg`
                }
            }

            const player: PlayerData = {
                id: playerInfos.playerId,
                name: playerInfos.playerName,
                avatar: playerInfos.avatarUrl,
                profileCover: null,
                url: `${ACCSABER_URL}/profile/${playerInfos.playerId}`,
                rank: parseInt(playerInfos.ranking),
                points: playerInfos.ap,
                history: '',
                banned: false,
                inactive: false,
                averageRankedAccuracy: playerInfos.averageAcc * 100,
                topScore: topAP
            }

            const ssPlayer = await PlayerModel.findOne({
                where: { playerId, leaderboard: 'scoresaber' }
            })
            if (ssPlayer?.playerCountry) player.country = ssPlayer.playerCountry

            return player
        } catch (error) {
            throw new AccSaberError(
                `Une erreur est survenue lors de la récupération du profil ${Leaderboards.AccSaber}`
            )
        }
    }

    /**
     * Récupération de la liste des joueurs dans le classement global de BeatLeader
     * @param page page du classement
     * @returns liste des joueurs
     */
    static async getGlobal(page: number) {
        try {
            const players = []

            const playersRequest = await this.send<{
                data: {
                    overallAccSaberPlayers: {
                        nodes: {
                            ap: number
                            avatarUrl: string
                            averageAcc: number
                            playerId: string
                            playerName: string
                            ranking: string
                        }[]
                    }
                }
            }>(`\
                {\
                    overallAccSaberPlayers(offset: ${(page - 1) * 50}, first: 50, orderBy: RANKING_ASC) {\
                        nodes {\
                            ap\
                            avatarUrl\
                            averageAcc\
                            playerId\
                            playerName\
                            ranking\
                        }\
                    }\
                }\
            `)
            const playersInfos = playersRequest.data.overallAccSaberPlayers
                .nodes.length
                ? playersRequest.data.overallAccSaberPlayers.nodes
                : null

            if (playersInfos) {
                for (const playerInfos of playersInfos) {
                    const player = {
                        id: playerInfos.playerId,
                        name: playerInfos.playerName,
                        avatar: playerInfos.avatarUrl,
                        url: `${ACCSABER_URL}/profile/${playerInfos.playerId}`,
                        country: null,
                        rank: parseInt(playerInfos.ranking),
                        points: playerInfos.ap
                    }
                    players.push(player)
                }
            }

            return players
        } catch (error) {
            throw new AccSaberError(
                'Une erreur est survenue lors de la récupération du classement global'
            )
        }
    }

    /**
     * Récupère le rang global d'un joueur par rapport à son identifiant AccSaber
     * @param accSaberId identifiant AccSaber du joueur
     * @returns rang du joueur
     */
    static async getPlayerRankById(accSaberId: string) {
        const playerData = await this.getPlayerData(accSaberId)
        return playerData.rank
    }

    /**
     * Récupère la liste des scores d'un joueur par rapport à son identifiant AccSaber
     * @param accSaberId identifiant AccSaber du joueur
     * @returns liste des scores du joueur
     */
    static async getPlayerScores(accSaberId: string): Promise<PlayerScore[]> {
        const cachedPlayerScores = await AccSaberPlayerScoresModel.findAll({
            where: { leaderboard: Leaderboards.AccSaber, playerId: accSaberId }
        })

        try {
            let hasNextPage = false
            let nextPage = 0

            do {
                console.log(nextPage)
                const scoresRequest = await this.send<{
                    data: {
                        accSaberScores: {
                            nodes: {
                                accuracy: number
                                ap: number
                                complexity: number
                                difficulty: string
                                leaderboardId: string
                                levelAuthorName: string
                                mods: string
                                ranking: string
                                score: number
                                songAuthorName: string
                                songHash: string
                                scoreId: string
                                songName: string
                                songSubName: string
                                timeSet: string
                                unmodifiedScore: number
                                leaderboard: {
                                    maxScore: number
                                }
                            }[]
                            pageInfo: {
                                hasNextPage: boolean
                            }
                        }
                    }
                }>(`\
                    {\
                        accSaberScores(\
                            condition: {playerId: \"${accSaberId}\", isRankedScore: true}\
                            orderBy: TIME_SET_DESC\
                            first: 100\
                            offset: ${nextPage * 100}\
                        ) {\
                            nodes {\
                                accuracy\
                                ap\
                                complexity\
                                difficulty\
                                leaderboardId\
                                levelAuthorName\
                                mods\
                                ranking\
                                score\
                                songAuthorName\
                                songHash\
                                scoreId\
                                songName\
                                songSubName\
                                timeSet\
                                unmodifiedScore\
                                leaderboard {\
                                    maxScore\
                                }\
                            }\
                            pageInfo {\
                                hasNextPage\
                            }\
                        }\
                    }\
                `)
                
                const playerScores = scoresRequest.data.accSaberScores.nodes
                hasNextPage = scoresRequest.data.accSaberScores.pageInfo.hasNextPage

                console.log(hasNextPage)

                if(hasNextPage) nextPage++

                for (const playerScore of playerScores) {
                    const cachedScore = cachedPlayerScores.find(
                        (cs) =>
                            cs.playerScore.leaderboardId ===
                            playerScore.leaderboardId
                    )
                    if (cachedScore) {
                        if (
                            playerScore.score !==
                            cachedScore.playerScore.score
                        ) {
                            cachedScore.playerScore = playerScore
                            await cachedScore.save()
                        } else {
                            hasNextPage = false
                            break
                        }
                    } else {
                        await AccSaberPlayerScoresModel.create({
                            leaderboard: Leaderboards.AccSaber,
                            playerId: accSaberId,
                            playerScore: playerScore
                        })
                    }
                }
            } while (hasNextPage)

            const playerScores = await AccSaberPlayerScoresModel.findAll({
                where: { leaderboard: Leaderboards.AccSaber, playerId: accSaberId }
            })

            const scores = playerScores
                .map((ps) => {
                    return {
                        rank: parseInt(ps.playerScore.ranking),
                        scoreId: parseInt(ps.playerScore.scoreId),
                        score: ps.playerScore.score,
                        unmodififiedScore: ps.playerScore.unmodifiedScore,
                        modifiers: ps.playerScore.mods,
                        points: ps.playerScore.ap,
                        acc: ps.playerScore.accuracy,
                        timeSet: ps.playerScore.timeSet,
                        leaderboardId: ps.playerScore.leaderboardId,
                        songHash: ps.playerScore.songHash,
                        songName: ps.playerScore.songName,
                        songSubName: ps.playerScore.songSubName,
                        songAuthorName: ps.playerScore.songAuthorName,
                        levelAuthorName: ps.playerScore.levelAuthorName,
                        difficulty: ps.playerScore.difficulty,
                        gameMode: 'SoloStandard',
                        ranked: true,
                        rating: ps.playerScore.complexity
                    }
                })
                .sort((a: PlayerScore, b: PlayerScore) => {
                    return (
                        new Date(b.timeSet).getTime() -
                        new Date(a.timeSet).getTime()
                    )
                })

            return scores
        } catch (error) {
            throw new AccSaberError(
                'Une erreur est survenue lors de la récupération des scores du joueur'
            )
        }
    }
}
