const Logger = require('./utils/logger')

try {
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

