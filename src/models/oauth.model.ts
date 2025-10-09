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

@Table({ tableName: 'oauth', freezeTableName: true, timestamps: false })
export class OAuthModel extends Model<
    InferAttributes<OAuthModel>,
    InferCreationAttributes<OAuthModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare name: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare client_id: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare client_secret: string

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare access_token: string

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare refresh_token: string

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare expires: number
}
