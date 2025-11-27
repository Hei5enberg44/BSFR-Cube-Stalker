import { Sequelize } from '@sequelize/core'
import { MariaDbDialect } from '@sequelize/mariadb'
import config from '../../config.json' with { type: 'json' }

import { DatabaseError } from '../utils/error.js'

import { CardModel } from '../models/card.model.js'
import { CooldownModel } from '../models/cooldown.model.js'
import { OAuthModel } from '../models/oauth.model.js'
import { PlayerModel } from '../models/player.model.js'
import {
    ScoreSaberPlayerScoresModel,
    BeatLeaderPlayerScoresModel
} from '../models/playerScores.model.js'
import { RankedModel } from '../models/ranked.model.js'

const sequelize = new Sequelize({
    dialect: MariaDbDialect,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.username,
    password: config.database.password,
    logging: false,
    define: { timestamps: false, freezeTableName: true },
    timezone: 'Europe/Paris',
    models: [
        CardModel,
        CooldownModel,
        OAuthModel,
        PlayerModel,
        ScoreSaberPlayerScoresModel,
        BeatLeaderPlayerScoresModel,
        RankedModel
    ]
})

export default {
    async test() {
        try {
            await sequelize.authenticate()
        } catch (error) {
            if (error.name === 'DATABASE_ERROR') {
                throw new DatabaseError(
                    'Échec de la connexion à la base de données : ' +
                        error.message
                )
            }
        }
    }
}
