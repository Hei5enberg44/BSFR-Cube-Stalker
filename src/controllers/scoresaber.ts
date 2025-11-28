import { components as ScoreSaberAPI } from '../api/scoresaber.js'
import { PlayerData, PlayerScore } from '../interfaces/player.interface.js'
import { ScoreSaberPlayerScoresModel } from '../models/playerScores.model.js'
import Logger from '../utils/logger.js'
import { ScoreSaberError } from '../utils/error.js'

type Player = ScoreSaberAPI['schemas']['Player']
type PlayerCollection = ScoreSaberAPI['schemas']['PlayerCollection']
type PlayerScoreCollection = ScoreSaberAPI['schemas']['PlayerScoreCollection']
type ScoreCollection = ScoreSaberAPI['schemas']['ScoreCollection']

const SCORESABER_URL = 'https://scoresaber.com'
const SCORESABER_API_URL = SCORESABER_URL + '/api/'
const PLAYER_URL = SCORESABER_API_URL + 'player/'
const LEADERBOARD_URL = SCORESABER_API_URL + 'leaderboard/'

const wait = (s: number) => new Promise((res) => setTimeout(res, s * 1000))

export default class ScoreSaber {
    /**
     * Envoi d'une requête à l'API de ScoreSaber
     * @param url url de la requête
     * @param log true|false pour logger la requête
     * @returns résultat de la requête
     */
    private static async send<T>(
        url: string,
        log: boolean = false
    ): Promise<T> {
        let data
        let error = false
        let retries = 0

        do {
            if (log)
                Logger.log('ScoreSaber', 'INFO', `Envoi de la requête "${url}"`)
            const res = await fetch(url)

            if (res.ok) {
                if (log)
                    Logger.log(
                        'ScoreSaber',
                        'INFO',
                        'Requête envoyée avec succès'
                    )
                data = await res.json()

                error = false
            } else {
                if (res.status === 400)
                    throw Error('Erreur 400 : Requête invalide')
                if (res.status === 404)
                    throw Error('Erreur 404 : Page introuvable')
                if (res.status === 422)
                    throw Error(
                        'Erreur 422 : La ressource demandée est introuvable'
                    )
                if (res.status === 503)
                    throw Error('Erreur 503 : Service non disponible')
                if (res.status === 500) {
                    Logger.log(
                        'ScoreSaber',
                        'ERROR',
                        'Erreur 500, nouvel essai dans 3 secondes'
                    )
                    if (retries < 5) await wait(3)
                    retries++
                }
                if (res.status === 429) {
                    Logger.log(
                        'ScoreSaber',
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
     * Récupération des données de profil ScoreSaber d'un joueur
     * @param url lien du profil ScoreSaber du joueur
     * @returns données de profil ScoreSaber du joueur
     */
    static async getPlayerDataByUrl(url: string) {
        try {
            const playerId = url.replace(
                /^https?:\/\/(?:new\.|www\.)?scoresaber\.com\/u\/([0-9]+).*$/,
                '$1'
            )
            const playerData = await this.getPlayerData(playerId)
            return playerData
        } catch (error) {
            throw new ScoreSaberError(
                `Profil ScoreSaber introuvable. Veuillez vérifier que le lien soit valide.\nℹ️ Exemple : \`${SCORESABER_URL}/u/[Identifiant ScoreSaber]\``
            )
        }
    }

    /**
     * Récuparation des données ScoreSaber d'un joueur
     * @param playerId identifiant ScoreSaber du joueur
     * @returns données ScoreSaber du joueur
     */
    static async getPlayerData(playerId: string): Promise<PlayerData> {
        try {
            const playerInfos = await this.send<Player>(
                PLAYER_URL + playerId + '/full'
            )

            let playerTopScore = null
            try {
                playerTopScore = await this.send<PlayerScoreCollection>(
                    PLAYER_URL + playerId + '/scores?sort=top&page=1&limit=1'
                )
            } catch(err) {}

            const scoreStats = playerInfos.scoreStats
            const topScore = playerTopScore?.playerScores.find(
                (ps) => ps.score.pp !== 0
            )

            let topPP = null
            if (topScore) {
                const difficulty =
                    topScore.leaderboard.difficulty.difficultyRaw.split('_')[1]
                topPP = {
                    rank: topScore.score.rank,
                    pp: topScore.score.pp,
                    score: topScore.score.modifiedScore,
                    acc:
                        (topScore.score.modifiedScore /
                            topScore.leaderboard.maxScore) *
                        100,
                    fc: topScore.score.fullCombo,
                    stars: topScore.leaderboard.stars,
                    name:
                        topScore.leaderboard.songAuthorName +
                        ' - ' +
                        topScore.leaderboard.songName +
                        (topScore.leaderboard.songSubName != ''
                            ? ' ' + topScore.leaderboard.songSubName
                            : ''),
                    difficulty: difficulty,
                    author: topScore.leaderboard.levelAuthorName,
                    cover: topScore.leaderboard.coverImage,
                    replay: null
                }
            }

            const player = {
                id: playerInfos.id,
                name: playerInfos.name,
                avatar: playerInfos.profilePicture,
                profileCover: null,
                url: `${SCORESABER_URL}/u/${playerInfos.id}`,
                rank: playerInfos.rank,
                countryRank: playerInfos.countryRank,
                pp: playerInfos.pp,
                country: playerInfos.country,
                history: playerInfos.histories,
                banned: playerInfos.banned,
                inactive: playerInfos.inactive,
                averageRankedAccuracy: scoreStats
                    ? scoreStats.averageRankedAccuracy
                    : 0,
                topPP
            }

            return player
        } catch (error) {
            throw new ScoreSaberError(
                'Une erreur est survenue lors de la récupération du profil ScoreSaber'
            )
        }
    }

    /**
     * Récupération de la liste des joueurs dans le classement global de ScoreSaber
     * @param page page du classement
     * @returns liste des joueurs
     */
    static async getGlobal(page: number) {
        try {
            const players = []

            const playersInfos = await this.send<PlayerCollection>(
                SCORESABER_API_URL + 'players?page=' + page
            )

            for (const playerInfos of playersInfos.players) {
                const player = {
                    id: playerInfos.id,
                    name: playerInfos.name,
                    avatar: playerInfos.profilePicture,
                    url: `${SCORESABER_URL}/u/${playerInfos.id}`,
                    country: playerInfos.country,
                    rank: playerInfos.rank,
                    pp: playerInfos.pp
                }
                players.push(player)
            }

            return players
        } catch (error) {
            throw new ScoreSaberError(
                'Une erreur est survenue lors de la récupération du classement global'
            )
        }
    }

    /**
     * Récupère le rang global d'un joueur par rapport à son identifiant ScoreSaber
     * @param scoreSaberId identifiant ScoreSaber du joueur
     * @returns rang du joueur
     */
    static async getPlayerRankById(scoreSaberId: string) {
        const playerData = await this.getPlayerData(scoreSaberId)
        return playerData.rank
    }

    /**
     * Récupération du classement d'un pays défini pour une map
     * @param leaderboardId identifiant du classement
     * @param country pays
     * @param page page du classement
     * @returns liste des scores du classement
     */
    static async getMapCountryLeaderboard(
        leaderboardId: number,
        country: string,
        page: number = 1
    ) {
        try {
            const data = await this.send<ScoreCollection>(
                LEADERBOARD_URL +
                    'by-id/' +
                    leaderboardId +
                    '/scores?countries=' +
                    country +
                    '&page=' +
                    page
            )
            return data.scores
        } catch (error) {
            throw new ScoreSaberError(
                'Une erreur est survenue lors de la récupération du top 1 du pays sur la map'
            )
        }
    }

    /**
     * Récupère la liste des scores d'un joueur par rapport à son identifiant ScoreSaber
     * @param scoreSaberId identifiant ScoreSaber du joueur
     * @returns liste des scores du joueur
     */
    static async getPlayerScores(scoreSaberId: string): Promise<PlayerScore[]> {
        try {
            const cachedPlayerScores =
                await ScoreSaberPlayerScoresModel.findAll({
                    where: { leaderboard: 'scoresaber', playerId: scoreSaberId }
                })

            let nextPage = null

            do {
                const data: PlayerScoreCollection =
                    await this.send<PlayerScoreCollection>(
                        PLAYER_URL +
                            scoreSaberId +
                            '/scores?sort=recent&limit=100&page=' +
                            (nextPage ?? 1)
                    )
                const playerScores = data.playerScores
                const metadata = data.metadata

                nextPage =
                    metadata.page + 1 <=
                    Math.ceil(metadata.total / metadata.itemsPerPage)
                        ? metadata.page + 1
                        : null

                for (const playerScore of playerScores) {
                    const cachedScore = cachedPlayerScores.find(
                        (cs) =>
                            cs.playerScore.leaderboard.id ===
                            playerScore.leaderboard.id
                    )
                    if (cachedScore) {
                        if (
                            playerScore.score.baseScore !==
                            cachedScore.playerScore.score.baseScore
                        ) {
                            cachedScore.playerScore = playerScore
                            await cachedScore.save()
                        } else {
                            nextPage = null
                            break
                        }
                    } else {
                        await ScoreSaberPlayerScoresModel.create({
                            leaderboard: 'scoresaber',
                            playerId: scoreSaberId,
                            playerScore: playerScore
                        })
                    }
                }
            } while (nextPage)

            const playerScores = await ScoreSaberPlayerScoresModel.findAll({
                where: { leaderboard: 'scoresaber', playerId: scoreSaberId }
            })

            const scores = playerScores
                .map((ps) => {
                    return {
                        rank: ps.playerScore.score.rank,
                        scoreId: ps.playerScore.score.id,
                        score: ps.playerScore.score.modifiedScore,
                        unmodififiedScore: ps.playerScore.score.baseScore,
                        modifiers: ps.playerScore.score.modifiers,
                        pp: ps.playerScore.score.pp,
                        weight: ps.playerScore.score.weight,
                        timeSet: ps.playerScore.score.timeSet,
                        badCuts: ps.playerScore.score.badCuts,
                        missedNotes: ps.playerScore.score.missedNotes,
                        maxCombo: ps.playerScore.score.maxCombo,
                        fullCombo: ps.playerScore.score.fullCombo,
                        leaderboardId: ps.playerScore.leaderboard.id,
                        songHash: ps.playerScore.leaderboard.songHash,
                        songName: ps.playerScore.leaderboard.songName,
                        songSubName: ps.playerScore.leaderboard.songSubName,
                        songAuthorName:
                            ps.playerScore.leaderboard.songAuthorName,
                        levelAuthorName:
                            ps.playerScore.leaderboard.levelAuthorName,
                        difficulty:
                            ps.playerScore.leaderboard.difficulty.difficulty,
                        difficultyRaw:
                            ps.playerScore.leaderboard.difficulty.difficultyRaw,
                        gameMode:
                            ps.playerScore.leaderboard.difficulty.gameMode,
                        maxScore: ps.playerScore.leaderboard.maxScore,
                        ranked: ps.playerScore.leaderboard.ranked,
                        stars: ps.playerScore.leaderboard.stars
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
            throw new ScoreSaberError(
                'Une erreur est survenue lors de la récupération des scores du joueur'
            )
        }
    }
}
