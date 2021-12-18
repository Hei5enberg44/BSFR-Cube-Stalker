const Logger = require('./utils/logger')
const { DatabaseError } = require('./utils/error')

try {
    const database = require('./controllers/database')
    const fs = require('fs')

    Logger.log('Application', 'INFO', 'Démarrage du bot')

    // Chargement de la configuration du bot
    if(!fs.existsSync('./config.json')) throw Error('Le fichier de configuration "config.json" est manquant')
    const config = require('./config.json')

    const { Client, Intents } = require('discord.js')
    const Commands = require('./controllers/commands')
    const Events = require('./controllers/events')
    const crons = require('./controllers/crons')

    Logger.log('Discord', 'INFO', 'Initialisation...')

    try {
        const client = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS
            ]
        })

        client.once('ready', async () => {
            Logger.log('Discord', 'INFO', 'Initialisation terminée')

            // Test de la connexion à la base de données
            try {
                Logger.log('Database', 'INFO', 'Connexion à la base de données...')
                await database.test()
                Logger.log('Database', 'INFO', 'Connexion à la base de données réussie')
            } catch(error) {
                if(error instanceof DatabaseError) {
                    Logger.log('Database', 'ERROR', error.message)
                    process.exit(1)
                }
            }
        
            // Chargement des commandes
            const commands = new Commands(client)
            await commands.load()
            await commands.listen()

            // Chargement des évènements
            const events = new Events(client)
            await events.load()

            // Tâches planifiées
            await crons.refreshLeaderboard(client)
            await crons.scanTop1FR()
            await crons.postTop1FR(client)
        
            Logger.log('Application', 'INFO', 'Le bot est prêt !')
        })
        
        client.login(config.token)
    } catch(error) {
        Logger.log('Discord', 'ERROR', `Une erreur est survenue : ${error.message}`)
    }
} catch(error) {
    console.log(error)
    Logger.log('Application', 'ERROR', `Démarrage du bot impossible : ${error.message}`)
}

