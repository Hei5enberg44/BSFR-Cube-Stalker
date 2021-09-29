const { Client, Intents } = require('discord.js')
const crons = require('./controllers/crons')
const Commands = require('./controllers/commands')
const Logger = require('./utils/logger')
const config = require('./config.json')

Logger.log('[Application] Démarrage du bot')
Logger.log('[Discord] Initialisation...')

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
        Logger.log('[Discord] Initialisation terminée')
    
        // Chargement des commandes
        const commands = new Commands(client)
        await commands.load()
        await commands.listen()

        // Tâches planifiées
        await crons.refreshLeaderboard(client)
    
        Logger.log('[Application] Le bot est prêt !')
    })
    
    client.login(config.token)
} catch(error) {
    Logger.log(`[Discord] [ERROR] Une erreur est survenue : ${error.message}`)
}