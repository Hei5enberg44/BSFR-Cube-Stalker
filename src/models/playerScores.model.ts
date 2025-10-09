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
