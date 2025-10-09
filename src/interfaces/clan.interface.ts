export interface ClanRanking {
    message: string
    data: ClanRankingData
}

export interface ClanRankingData {
    playerId: string | null
    clanId: number | null
    clan: null
    playerAction: number | null
    score: ClanRankingScore | null
    changes: ClanRankingChange[]
}

export interface ClanRankingScore {
    id: number
    accuracy: number
    playerId: string
    pp: number
    modifiers: string
    leaderboardId: string
}

export interface ClanRankingChange {
    leaderboardId: string | null
    previousCaptorId: number | null
    currentCaptorId: number | null
}
