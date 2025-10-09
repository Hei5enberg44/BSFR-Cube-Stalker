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

export enum CardStatus {
    Preview = 0,
    Pending = 1,
    Approved = 2,
    Denied = 3
}

@Table({ tableName: 'cards', freezeTableName: true, timestamps: false })
export class CardModel extends Model<
    InferAttributes<CardModel>,
    InferCreationAttributes<CardModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare memberId: string

    @Attribute(DataTypes.BLOB('medium'))
    @NotNull
    declare image: Buffer

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare status: CardStatus
}
