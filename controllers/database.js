const { Sequelize, DataTypes } = require('sequelize')
const { DatabaseError } = require('../utils/error')
const config = require('../config.json')

const sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mariadb',
    logging: false
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
}, {
    timestamps: false,
    freezeTableName: true
})

const LastMembersMaps = sequelize.define('last_members_maps', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    scoreSaberId: DataTypes.STRING(255),
    timeSet: DataTypes.STRING(255)
}, {
    timestamps: false,
    freezeTableName: true
})

const Leaderboard = sequelize.define('leaderboard', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    scoreSaberId: DataTypes.STRING(255),
    scoreSaberName: DataTypes.STRING(255),
    scoreSaberCountry: DataTypes.STRING(5),
    pp: DataTypes.FLOAT,
    rank: DataTypes.INTEGER,
    countryRank: DataTypes.INTEGER,
    averageRankedAccuracy: DataTypes.FLOAT,
    serverRankAcc: DataTypes.INTEGER,
    serverRankPP: DataTypes.INTEGER
}, {
    timestamps: false,
    freezeTableName: true
})

const Members = sequelize.define('members', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    scoreSaberId: DataTypes.STRING(255),
    top1: DataTypes.BOOLEAN
}, {
    timestamps: false,
    freezeTableName: true
})

const Top1 = sequelize.define('top1', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    rank: DataTypes.INTEGER,
    score: DataTypes.INTEGER,
    acc: DataTypes.FLOAT,
    pp: DataTypes.FLOAT,
    timeSet: DataTypes.STRING(255),
    leaderboardId: DataTypes.INTEGER,
    songName: DataTypes.TEXT,
    songCoverUrl: DataTypes.TEXT,
    levelKey: DataTypes.STRING(10),
    levelAuthorName: DataTypes.TEXT,
    levelDifficulty: DataTypes.STRING(255),
    levelGameMode: DataTypes.STRING(255),
    scoreSaberId: DataTypes.STRING(255),
    scoreSaberName: DataTypes.STRING(255),
    beatenScoreSaberId: DataTypes.STRING(255),
    beatenScoreSaberName: DataTypes.STRING(255),
    memberId: DataTypes.STRING(255)
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = {
    test, Cooldowns, LastMembersMaps, Leaderboard, Members, Top1
}