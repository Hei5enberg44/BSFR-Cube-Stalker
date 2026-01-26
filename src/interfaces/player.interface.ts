export interface PlayerData {
    id: string
    name: string
    avatar: string
    profileCover: string | null
    url: string
    rank: number
    countryRank?: number
    points: number
    country?: string
    history: string
    banned: boolean
    inactive: boolean
    averageRankedAccuracy: number
    topScore: TopScore | null
}

export interface TopScore {
    rank: number
    points: number
    score: number
    acc: number
    fc: boolean
    rating: number
    name: string
    difficulty: string
    author: string
    cover: string
}

export interface Top1Data {
    rank: number
    score: number
    acc: number
    pp: number
    timeSet: string
    leaderboardId: number
    songName: string
    songCoverUrl: string
    levelKey: string
    levelAuthorName: string
    levelDifficulty: string
    levelGameMode: string
    ranked: boolean
    scoreSaberId: string
    scoreSaberName: string
    scoreSaberCountry: string
    beatenScoreSaberId: string
    beatenScoreSaberName: string
    replay: string | null
    memberId: string
}

export interface PlayerScore {
    rank: number
    scoreId: number
    score: number
    unmodififiedScore: number
    points: number
    acc: number
    timeSet: string
    leaderboardId: number | string
    songHash: string
    songName: string
    songSubName: string
    songAuthorName: string
    levelAuthorName: string
    difficulty: string
    gameMode: string
    ranked: boolean
    rating: number
}

export interface PlayerProgress {
    rankDiff: number
    countryRankDiff: number
    pointsDiff: number
    accDiff: number
    serverPointsDiff: number
    serverAccDiff: number
}
