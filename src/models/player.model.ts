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
    declare playerName: string | null

    @Attribute(DataTypes.STRING(5))
    declare playerCountry: string | null

    @Attribute(DataTypes.DOUBLE)
    declare pp: number | null

    @Attribute(DataTypes.INTEGER)
    declare rank: number | null

    @Attribute(DataTypes.INTEGER)
    declare countryRank: number | null

    @Attribute(DataTypes.DOUBLE)
    declare averageRankedAccuracy: number | null

    @Attribute(DataTypes.INTEGER)
    declare serverRankAcc: number | null

    @Attribute(DataTypes.INTEGER)
    declare serverRankPP: number | null

    @Attribute(DataTypes.BOOLEAN)
    @NotNull
    declare top1: boolean
}
