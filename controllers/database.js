const { MongoClient, Db } = require('mongodb')
const config = require('../config.json')

class Database {
    constructor() {
        const url = `mongodb://${config.database.username}:${config.database.password}@${config.database.host}:${config.database.port}`
        this.client = new MongoClient(url)
        this.dbName = `${config.database.name}`
    }

    /**
     * Connection à la base de données
     * @returns {Promise<Db>} connexion à la base de données
     */
    async connect() {
        await this.client.connect()
        return this.client.db(this.dbName)
    }

    /**
     * Fermeture de la connexion à la base de données
     */
     async close() {
        this.client.close()
    }
}

module.exports = Database