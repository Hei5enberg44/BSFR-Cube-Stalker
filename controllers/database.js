const { Sequelize, DataTypes } = require('sequelize')
const { DatabaseError } = require('../utils/error')
const config = require('../config.json')

const sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mariadb',
    logging: false,
    define: {
        timestamps: false,
        freezeTableName: true
    }
})

const test = async function() {
    try {
        await sequelize.authenticate()
    } catch(error) {
        throw new DatabaseError('Échec de la connexion à la base de données : ' + error.message)
    }
}

const Cooldowns = sequelize.define('cooldowns', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    commandName: DataTypes.STRING(255),
    memberId: DataTypes.STRING(255),
    expirationDate: DataTypes.INTEGER
})

const Players = sequelize.define('players', {
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
    pp: DataTypes.FLOAT,
    rank: DataTypes.INTEGER,
    countryRank: DataTypes.INTEGER,
    averageRankedAccuracy: DataTypes.FLOAT,
    serverRankAcc: DataTypes.INTEGER,
    serverRankPP: DataTypes.INTEGER,
    top1: DataTypes.BOOLEAN
})

const Leaderboard = sequelize.define('leaderboard', {
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
    pp: DataTypes.FLOAT,
    rank: DataTypes.INTEGER,
    countryRank: DataTypes.INTEGER,
    averageRankedAccuracy: DataTypes.FLOAT,
    serverRankAcc: DataTypes.INTEGER,
    serverRankPP: DataTypes.INTEGER,
})

module.exports = {
    test, Cooldowns, Players, Leaderboard
}