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
import { TopScore } from '../interfaces/player.interface.js'

@Table({ tableName: 'players', freezeTableName: true, timestamps: false })
export class PlayerModel extends Model<
    InferAttributes<PlayerModel>,
    InferCreationAttributes<PlayerModel>
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
    declare memberId: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare playerId: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare playerName: string

    @Attribute(DataTypes.STRING(5))
    declare playerCountry: string | null

    @Attribute(DataTypes.DOUBLE)
    @NotNull
    declare points: number

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare rank: number

    @Attribute(DataTypes.INTEGER)
    declare countryRank: number | null

    @Attribute(DataTypes.DOUBLE)
    @NotNull
    declare averageRankedAccuracy: number

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare serverRankAcc: number

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare serverRankPoints: number

    @Attribute(DataTypes.JSON)
    declare topScore: TopScore | null

    @Attribute(DataTypes.BOOLEAN)
    @NotNull
    declare top1: boolean
}
