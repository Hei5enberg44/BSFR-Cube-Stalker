import { components as BeatSaverAPI } from '../api/beatsaver.js'
import { Sequelize, DataTypes, Model, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize'
import { DatabaseError } from '../utils/error.js'
import config from '../config.json' assert { type: 'json' }

const sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mariadb',
    logging: false,
    define: {
        timestamps: false,
        freezeTableName: true
    },
    timezone: 'Europe/Paris'
})

export default {
    async test() {
        try {
            await sequelize.authenticate()
        } catch(error) {
            if(error.name === 'DATABASE_ERROR') {
                throw new DatabaseError('Échec de la connexion à la base de données : ' + error.message)
            }
        }
    }
}

interface CooldownModel extends Model<InferAttributes<CooldownModel>, InferCreationAttributes<CooldownModel>> {
    id: CreationOptional<number>,
    commandName: string,
    memberId: string,
    expirationDate: number
}

const CooldownModel = sequelize.define<CooldownModel>('cooldowns', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    commandName: DataTypes.STRING(255),
    memberId: DataTypes.STRING(255),
    expirationDate: DataTypes.INTEGER()
})

interface PlayerModel extends Model<InferAttributes<PlayerModel>, InferCreationAttributes<PlayerModel>> {
    id: CreationOptional<number>,
    leaderboard: string,
    memberId: string,
    playerId: string,
    playerName: string | null,
    playerCountry: string | null,
    pp: number | null,
    rank: number | null,
    countryRank: number | null,
    averageRankedAccuracy: number | null,
    serverRankAcc: number | null,
    serverRankPP: number | null,
    top1: boolean
}

const PlayerModel = sequelize.define<PlayerModel>('players', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    leaderboard: DataTypes.STRING(255),
    memberId: DataTypes.STRING(255),
    playerId: DataTypes.STRING(255),
    playerName: DataTypes.STRING(255),
    playerCountry: DataTypes.STRING(5),
    pp: DataTypes.DOUBLE(),
    rank: DataTypes.INTEGER(),
    countryRank: DataTypes.INTEGER(),
    averageRankedAccuracy: DataTypes.DOUBLE(),
    serverRankAcc: DataTypes.INTEGER(),
    serverRankPP: DataTypes.INTEGER(),
    top1: DataTypes.BOOLEAN()
})

interface LeaderboardModel extends Model<InferAttributes<LeaderboardModel>, InferCreationAttributes<LeaderboardModel>> {
    id: CreationOptional<number>,
    leaderboard: string,
    memberId: string,
    playerId: string,
    playerName: string,
    playerCountry: string,
    pp: number,
    rank: number,
    countryRank: number,
    averageRankedAccuracy: number,
    serverRankAcc: number,
    serverRankPP: number
}

const LeaderboardModel = sequelize.define<LeaderboardModel>('leaderboard', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    leaderboard: DataTypes.STRING(255),
    memberId: DataTypes.STRING(255),
    playerId: DataTypes.STRING(255),
    playerName: DataTypes.STRING(255),
    playerCountry: DataTypes.STRING(5),
    pp: DataTypes.DOUBLE(),
    rank: DataTypes.INTEGER(),
    countryRank: DataTypes.INTEGER(),
    averageRankedAccuracy: DataTypes.DOUBLE(),
    serverRankAcc: DataTypes.INTEGER(),
    serverRankPP: DataTypes.INTEGER()
})

type MapDetail = BeatSaverAPI['schemas']['MapDetail']

interface RankedModel extends Model<InferAttributes<RankedModel>, InferCreationAttributes<RankedModel>> {
    id: CreationOptional<number>,
    map: MapDetail
}

const RankedModel = sequelize.define<RankedModel>('ranked', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    map: DataTypes.JSON()
})

interface CardsModel extends Model<InferAttributes<CardsModel>, InferCreationAttributes<CardsModel>> {
    id: CreationOptional<number>,
    memberId: string,
    image: Buffer,
    status: number
}

const CardsModel = sequelize.define<CardsModel>('cards', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    image: DataTypes.BLOB(),
    status: DataTypes.INTEGER()
})

export {
    CooldownModel,
    PlayerModel,
    LeaderboardModel,
    RankedModel,
    CardsModel
}