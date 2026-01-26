import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from '@sequelize/core'
import {
    Table,
    Attribute,
    PrimaryKey,
    AutoIncrement,
    NotNull
} from '@sequelize/core/decorators-legacy'

import { components as ScoreSaberAPI } from '../api/scoresaber.js'
import { components as BeatLeaderAPI } from '../api/beatleader.js'

type ScoreSaberPlayerScore = ScoreSaberAPI['schemas']['PlayerScore']
type BeatLeaderPlayerScore =
    BeatLeaderAPI['schemas']['ScoreResponseWithMyScore']
type AccSaberPlayerScore = {
    accuracy: number
    ap: number
    complexity: number
    difficulty: string
    leaderboard: {
        maxScore: number
    }
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
}

@Table({ tableName: 'player_scores', freezeTableName: true, timestamps: false })
export class ScoreSaberPlayerScoresModel extends Model<
    InferAttributes<ScoreSaberPlayerScoresModel>,
    InferCreationAttributes<ScoreSaberPlayerScoresModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare leaderboard: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare playerId: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare playerScore: ScoreSaberPlayerScore
}

@Table({ tableName: 'player_scores' })
export class BeatLeaderPlayerScoresModel extends Model<
    InferAttributes<BeatLeaderPlayerScoresModel>,
    InferCreationAttributes<BeatLeaderPlayerScoresModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare leaderboard: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare playerId: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare playerScore: BeatLeaderPlayerScore
}

@Table({ tableName: 'player_scores' })
export class AccSaberPlayerScoresModel extends Model<
    InferAttributes<AccSaberPlayerScoresModel>,
    InferCreationAttributes<AccSaberPlayerScoresModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare leaderboard: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare playerId: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare playerScore: AccSaberPlayerScore
}
