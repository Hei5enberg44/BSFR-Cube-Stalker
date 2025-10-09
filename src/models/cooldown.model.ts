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

@Table({ tableName: 'cooldown', freezeTableName: true, timestamps: false })
export class CooldownModel extends Model<
    InferAttributes<CooldownModel>,
    InferCreationAttributes<CooldownModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare commandName: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare memberId: string

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare expirationDate: number
}
