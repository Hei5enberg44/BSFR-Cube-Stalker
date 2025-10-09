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

@Table({ tableName: 'leaderboard', freezeTableName: true, timestamps: false })
export class LeaderboardModel extends Model<
    InferAttributes<LeaderboardModel>,
    InferCreationAttributes<LeaderboardModel>
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
    @NotNull
    declare playerCountry: string

    @Attribute(DataTypes.DOUBLE)
    @NotNull
    declare pp: number

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare rank: number

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare countryRank: number

    @Attribute(DataTypes.DOUBLE)
    @NotNull
    declare averageRankedAccuracy: number

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare serverRankAcc: number

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare serverRankPP: number
}
