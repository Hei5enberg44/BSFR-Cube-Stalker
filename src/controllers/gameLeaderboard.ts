import scoresaber from './scoresaber.js'
import beatleader from './beatleader.js'
import accsaber from './accsaber.js'
import { RGBTuple } from 'discord.js'

enum Leaderboards {
    ScoreSaber = 'ScoreSaber',
    BeatLeader = 'BeatLeader',
    AccSaber = 'AccSaber'
}

class GameLeaderboard {
    public requests: typeof scoresaber | typeof beatleader | typeof accsaber

    constructor(leaderboardName: Leaderboards) {
        switch (leaderboardName) {
            case Leaderboards.ScoreSaber:
                this.requests = scoresaber
                break
            case Leaderboards.BeatLeader:
                this.requests = beatleader
                break
            case Leaderboards.AccSaber:
                this.requests = accsaber
                break
            default:
                throw new Error(
                    `Leaderboard « ${leaderboardName} » non pris en charge`
                )
        }
    }

    public static getLdColor(leaderboard: Leaderboards) {
        switch (leaderboard) {
            case Leaderboards.ScoreSaber:
                return [255, 222, 24] as RGBTuple
            case Leaderboards.BeatLeader:
                return [217, 16, 65] as RGBTuple
            case Leaderboards.AccSaber:
                return [10, 143, 237] as RGBTuple
            default:
                return undefined
        }
    }

    public static getLdIconName(leaderboard: Leaderboards) {
        switch (leaderboard) {
            case Leaderboards.ScoreSaber:
                return 'ss'
            case Leaderboards.BeatLeader:
                return 'bl'
            case Leaderboards.AccSaber:
                return 'as'
            default:
                return ''
        }
    }
}

export { Leaderboards, GameLeaderboard }
