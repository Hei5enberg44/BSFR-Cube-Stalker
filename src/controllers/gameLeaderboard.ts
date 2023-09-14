import scoresaber from './scoresaber.js'
import beatleader from './beatleader.js'

enum Leaderboards {
    ScoreSaber = 'scoresaber',
    BeatLeader = 'beatleader'
}

class GameLeaderboard {
    public requests: typeof scoresaber | typeof beatleader

    constructor(leaderboardName: Leaderboards) {
        switch(leaderboardName) {
            case Leaderboards.ScoreSaber:
                this.requests = scoresaber
                break
            case Leaderboards.BeatLeader:
                this.requests = beatleader
                break
            default:
                throw new Error(`Leaderboard « ${leaderboardName} » non pris en charge`)
        }
    }
}

export {
    Leaderboards,
    GameLeaderboard
}