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

import { MapDetail } from '../api/beatsaver.js'

@Table({ tableName: 'ranked', freezeTableName: true, timestamps: false })
export class RankedModel extends Model<
    InferAttributes<RankedModel>,
    InferCreationAttributes<RankedModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare leaderboard: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare map: MapDetail
}
