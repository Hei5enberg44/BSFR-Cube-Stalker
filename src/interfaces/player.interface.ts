export interface PlayerData {
    id: string
    name: string
    avatar: string
    profileCover: string | null
    url: string
    rank: number
    countryRank: number
    pp: number
    country: string
    history: string
    banned: boolean
    averageRankedAccuracy: number
    topPP: TopPP | null
}

export interface TopPP {
    rank: number
    pp: number
    score: number
    acc: number
    fc: boolean
    stars: number
    name: string
    difficulty: string
    author: string
    cover: string
    replay: string | null
}

export interface PlayerRanking {
    pp: number
    rank: number
    countryRank: number
    averageRankedAccuracy: number
    serverRankPP: number
    serverRankAcc: number
    serverLdTotal: number
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
    modifiers: string
    pp: number
    weight: number
    timeSet: string
    badCuts: number
    missedNotes: number
    maxCombo: number
    fullCombo: boolean
    leaderboardId: number | string
    songHash: string
    songName: string
    songSubName: string
    songAuthorName: string
    levelAuthorName: string
    difficulty: number
    difficultyRaw: string
    gameMode: string
    maxScore: number
    ranked: boolean
    stars: number
}

export interface PlayerProgress {
    rankDiff: number
    countryRankDiff: number
    ppDiff: number
    accDiff: number
    serverPPDiff: number
    serverAccDiff: number
}
