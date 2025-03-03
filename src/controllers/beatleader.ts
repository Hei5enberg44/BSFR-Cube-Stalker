import { components as BeatLeaderAPI } from '../api/beatleader.js'
import { PlayerData, PlayerScore } from '../interfaces/player.interface.js'
import { BeatLeaderPlayerScoresModel } from '../controllers/database.js'
import Logger from '../utils/logger.js'
import { BeatLeaderError } from '../utils/error.js'

type PlayerResponseFull = BeatLeaderAPI['schemas']['PlayerResponseFull']
type ScoreResponseWithMyScoreResponseWithMetadata = BeatLeaderAPI['schemas']['ScoreResponseWithMyScoreResponseWithMetadata']
type PlayerResponseWithStatsResponseWithMetadata = BeatLeaderAPI['schemas']['PlayerResponseWithStatsResponseWithMetadata']
type LeaderboardResponse = BeatLeaderAPI['schemas']['LeaderboardResponse']
type PlayerResponseClanResponseFullResponseWithMetadataAndContainer = BeatLeaderAPI['schemas']['PlayerResponseClanResponseFullResponseWithMetadataAndContainer']
type ClanRankingResponseClanResponseFullResponseWithMetadataAndContainer = BeatLeaderAPI['schemas']['ClanRankingResponseClanResponseFullResponseWithMetadataAndContainer']

interface PlaylistResponse {
    playlistTitle: string,
    playlistAuthor: string,
    songs: PlaylistSong[]
}

interface PlaylistSong {
    hash: string,
    songName: string,
    levelAuthorName: string,
    difficulties: PlaylistSongDifficulty[]
}

interface PlaylistSongDifficulty {
    name: string,
    characteristic: string
}

const BEATLEADER_URL = 'https://beatleader.xyz'
const BEATLEADER_API_URL = 'https://api.beatleader.xyz/'
const PLAYER_URL = `${BEATLEADER_API_URL}player/`
const LEADERBOARD_URL = `${BEATLEADER_API_URL}leaderboard/`
const CLAN_URL = `${BEATLEADER_API_URL}clan/`

const wait = (s: number) => new Promise((res) => setTimeout(res, s * 1000))

export default class BeatLeader {
    /**
     * Envoi d'une requête à l'API de BeatLeader
     * @param url url de la requête
     * @param log true|false pour logger la requête
     * @returns résultat de la requête
     */
    private static async send<T>(url: string, log: boolean = false): Promise<T> {
        let data
        let error = false
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
                    if(retries < 5) {
                        await wait(3)
                        retries++
                    } else {
                        throw Error('Erreur 500 : Erreur interne du serveur')
                    }
                }
                if(res.status === 429) {
                    Logger.log('BeatLeader', 'ERROR', 'Erreur 429, nouvel essai dans 60 secondes')
                    await wait(60)
                }

                error = true
            }
        } while(error)

        return data
    }

    /**
     * Récupération des données de profil BeatLeader d'un joueur
     * @param url lien du profil BeatLeader du joueur
     * @returns données de profil BeatLeader du joueur
     */
    static async getProfile(url: string) {
        try {
            const playerId = url.replace(/^https?:\/\/(?:www\.)?beatleader\.(?:xyz|com)\/u\/([0-9]+).*$/, '$1')

            const playerInfos = await this.send<PlayerResponseFull>(`${PLAYER_URL}${playerId}`)

            const player = {
                id: playerInfos.id,
                name: playerInfos.name,
                avatar: playerInfos.avatar,
                url: `${BEATLEADER_URL}/u/${playerInfos.id}`,
                country: playerInfos.country,
                rank: playerInfos.rank,
                pp: playerInfos.pp,
                banned: playerInfos.banned,
                inactive: playerInfos.inactive
            }

            return player
        } catch(error) {
            throw new BeatLeaderError(`Profil BeatLeader introuvable. Veuillez vérifier que le lien soit valide.\nℹ️ Exemple : \`${BEATLEADER_URL}/u/[Identifiant BeatLeader]\``)
        }
    }

    /**
     * Récuparation des données BeatLeader d'un joueur
     * @param playerId identifiant BeatLeader du joueur
     * @returns données BeatLeader du joueur
     */
    static async getPlayerData(playerId: string): Promise<PlayerData> {
        try {
            const playerInfos = await this.send<PlayerResponseFull>(PLAYER_URL + playerId)
            const playerTopScore = await this.send<ScoreResponseWithMyScoreResponseWithMetadata>(`${PLAYER_URL}${playerId}/scores?sortBy=pp&page=1`)

            let topPP = null
            if(playerTopScore.data && playerTopScore.data[0]) {
                const topScore = playerTopScore.data[0]

                const difficulty = topScore.leaderboard.difficulty.difficultyName

                topPP = {
                    rank: topScore.rank,
                    pp: topScore.pp,
                    score: topScore.modifiedScore,
                    acc: topScore.accuracy ? topScore.accuracy * 100 : 0,
                    fc: topScore.fullCombo,
                    stars: topScore.leaderboard.difficulty.stars ?? 0,
                    name: topScore.leaderboard.song.author + ' - ' + topScore.leaderboard.song.name + (topScore.leaderboard.song.subName !== '' ? ' ' + topScore.leaderboard.song.subName : ''),
                    difficulty: difficulty,
                    author: topScore.leaderboard.song.mapper,
                    cover: topScore.leaderboard.song.coverImage,
                    replay: `https://replay.beatleader.xyz/?scoreId=${topScore.id}`
                }
            }

            const scoreStats = playerInfos.scoreStats

            const player = {
                id: playerInfos.id,
                name: playerInfos.name,
                avatar: playerInfos.avatar,
                profileCover: playerInfos.profileSettings.profileCover,
                url: `${BEATLEADER_URL}/u/${playerInfos.id}`,
                rank: playerInfos.rank,
                countryRank: playerInfos.countryRank,
                pp: playerInfos.pp,
                country: playerInfos.country,
                history: playerInfos.history ? playerInfos.history.map(h => h.rank).join(',') : '',
                banned: playerInfos.banned,
                averageRankedAccuracy: scoreStats.averageRankedAccuracy * 100,
                topPP
            }

            return player
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du profil BeatLeader')
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

            const playersInfos = await this.send<PlayerResponseWithStatsResponseWithMetadata>(`${BEATLEADER_API_URL}players?page=${page}`)

            if(playersInfos.data) {
                for(const playerInfos of playersInfos.data) {
                    const player = {
                        id: playerInfos.id,
                        name: playerInfos.name,
                        avatar: playerInfos.avatar,
                        url: `${BEATLEADER_URL}/u/${playerInfos.id}`,
                        country: playerInfos.country,
                        rank: playerInfos.rank,
                        pp: playerInfos.pp
                    }
                    players.push(player)
                }
            }

            return players
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du classement global')
        }
    }

    /**
     * Récupère le rang global d'un joueur par rapport à son identifiant BeatLeader
     * @param beatLeaderId identifiant BeatLeader du joueur
     * @returns rang du joueur
     */
    static async getPlayerRankById(beatLeaderId: string) {
        const playerData = await this.getPlayerData(beatLeaderId)
        return playerData.rank
    }

    /**
     * Récupération du classement d'un pays défini pour une map
     * @param leaderboardId identifiant du classement
     * @param country pays
     * @param page page du classement
     * @returns liste des scores du classement
     */
    static async getMapCountryLeaderboard(leaderboardId: string, country: string, page: number = 1) {
        try {
            const data = await this.send<LeaderboardResponse>(`${LEADERBOARD_URL}${leaderboardId}?countries=${country}&page=${page}`)

            return data.scores
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du top 1 du pays sur la map')
        }
    }

    /**
     * Récupération du classement d'une map
     * @param leaderboardId identifiant du classement
     * @param count nombre de scores à retourner (défaut: 10)
     * @returns classement de la map
     */
    static async getMapLeaderboardById(leaderboardId: string, count: number = 10) {
        try {
            const data = await this.send<LeaderboardResponse>(`${LEADERBOARD_URL}${leaderboardId}?count=${count}`)

            return data
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération du classement de la map')
        }
    }

    /**
     * Récupère la liste des scores d'un joueur par rapport à son identifiant BeatLeader
     * @param beatLeaderId identifiant BeatLeader du joueur
     * @returns liste des scores du joueur
     */
    static async getPlayerScores(beatLeaderId: string): Promise<PlayerScore[]> {
        const cachedPlayerScores = await BeatLeaderPlayerScoresModel.findAll({
            where: {
                leaderboard: 'beatleader',
                playerId: beatLeaderId
            }
        })

        try {
            let nextPage: number | null = null

            do {
                const data: ScoreResponseWithMyScoreResponseWithMetadata = await this.send<ScoreResponseWithMyScoreResponseWithMetadata>(`${PLAYER_URL}${beatLeaderId}/scores?sortBy=date&order=desc&count=100&page=${nextPage ?? 1}`)
                const playerScores = data.data
                const metadata = data.metadata

                nextPage = metadata.page + 1 <= Math.ceil(metadata.total / metadata.itemsPerPage) ? metadata.page + 1 : null

                if(playerScores) {
                    for(const playerScore of playerScores) {
                        const cachedScore = cachedPlayerScores.find(cs => cs.playerScore.leaderboard.id === playerScore.leaderboardId)
                        if(cachedScore) {
                            if(playerScore.baseScore !== cachedScore.playerScore.baseScore) {
                                cachedScore.playerScore = playerScore
                                await cachedScore.save()
                            } else {
                                nextPage = null
                                break
                            }
                        } else {
                            await BeatLeaderPlayerScoresModel.create({
                                leaderboard: 'beatleader',
                                playerId: beatLeaderId,
                                playerScore: playerScore
                            })
                        }
                    }
                }
            } while(nextPage)

            const playerScores = await BeatLeaderPlayerScoresModel.findAll({
                where: {
                    leaderboard: 'beatleader',
                    playerId: beatLeaderId
                }
            })

            const scores = playerScores.map(ps => {
                return {
                    rank: ps.playerScore.rank,
                    scoreId: ps.playerScore.id,
                    score: ps.playerScore.modifiedScore,
                    unmodififiedScore: ps.playerScore.baseScore,
                    modifiers: ps.playerScore.modifiers,
                    pp: ps.playerScore.pp,
                    weight: ps.playerScore.weight,
                    timeSet: ps.playerScore.timeset,
                    badCuts: ps.playerScore.badCuts,
                    missedNotes: ps.playerScore.missedNotes,
                    maxCombo: ps.playerScore.maxCombo,
                    fullCombo: ps.playerScore.fullCombo,
                    leaderboardId: ps.playerScore.leaderboard.id,
                    songHash: ps.playerScore.leaderboard.song.hash,
                    songName: ps.playerScore.leaderboard.song.name,
                    songSubName: ps.playerScore.leaderboard.song.subName,
                    songAuthorName: ps.playerScore.leaderboard.song.author,
                    levelAuthorName: ps.playerScore.leaderboard.song.mapper,
                    difficulty: ps.playerScore.leaderboard.difficulty.value,
                    difficultyRaw: ps.playerScore.leaderboard.difficulty.difficultyName,
                    gameMode: ps.playerScore.leaderboard.difficulty.modeName,
                    maxScore: ps.playerScore.leaderboard.difficulty.maxScore,
                    ranked: ps.playerScore.leaderboard.difficulty.stars ? true : false,
                    stars: ps.playerScore.leaderboard.difficulty.stars ?? 0
                }
            }).sort((a: PlayerScore, b: PlayerScore) => {
                return (new Date(b.timeSet)).getTime() - (new Date(a.timeSet)).getTime()
            })

            return scores
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération des scores du joueur')
        }
    }

    /**
     * Récupère les maps ranked en fonction de différents critères de recherche
     * @param starsMin nombre d'étoiles minimum
     * @param starsMax nombre d'étoiles maximum
     * @returns liste des maps ranked
     */
    static async searchRanked(starsMin: number = 0, starsMax: number = 16) {
        const playlist = await this.send<PlaylistResponse>(`${BEATLEADER_API_URL}playlist/generate?count=2000&stars_from=${starsMin}&stars_to=${starsMax}`)
        if(playlist) return playlist.songs
        return []
    }

    /**
     * Récupération des informations concernant un clan par rapport à son identifiant
     * @param clanId identifiant du clan
     * @returns informations du clan
     */
    static async getClanById(clanId: number) {
        try {
            const data = await this.send<PlayerResponseClanResponseFullResponseWithMetadataAndContainer>(`${CLAN_URL}id/${clanId}?count=1`)

            return data
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération des informations du clan')
        }
    }

    /**
     * Récupération des maps à conquerir pour la guerre de clan BeatLeader
     * @param clanId identifiant du clan BeatLeader
     */
    static async getClanMaps(clanId: number, count: number = 100) {
        try {
            const data = await this.send<ClanRankingResponseClanResponseFullResponseWithMetadataAndContainer>(`${CLAN_URL}id/${clanId}/maps?page=1&count=${count}&sortBy=toconquer`)

            return data.data
        } catch(error) {
            throw new BeatLeaderError('Une erreur est survenue lors de la récupération des maps du clan')
        }
    }
}