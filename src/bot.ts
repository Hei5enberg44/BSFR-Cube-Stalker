import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, GatewayIntentBits, ActivityType, PresenceUpdateStatus } from 'discord.js'
import Commands from './controllers/commands.js'
import Events from './controllers/events.js'
import Modals from './controllers/modals.js'
import database from './controllers/database.js'
import Crons from './controllers/crons.js'
import top1 from './controllers/top1.js'
import Logger from './utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

try {
    Logger.log('Application', 'INFO', 'Démarrage du bot')

    // Chargement de la configuration du bot
    if(!existsSync(resolve(__dirname, './config.json'))) throw Error('Le fichier de configuration "config.json" est manquant')
    const { default: config } = await import('./config.json', { assert: { type: 'json' } })

    try {
        Logger.log('Discord', 'INFO', 'Initialisation...')

        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions
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
                if(error.name === 'DATABASE_ERROR') {
                    Logger.log('Database', 'ERROR', error.message)
                    process.exit(1)
                }
            }
        
            // Chargement des commandes
            const commands = new Commands(client)
            await commands.load()
            await commands.listen()

            // Chargement des modales
            const modals = new Modals(client)
            await modals.load()
            await modals.listen()

            // Chargement des évènements
            const events = new Events(client)
            await events.load()

            // Tâches planifiées
            const crons = new Crons(client)
            await crons.refreshLeaderboard()
            await crons.getLastRankedMaps()

            // Top 1 pays
            top1.listen(client)

            // Statut du bot
            client.user?.setPresence({
                activities: [
                    {
                        name: 'Beat Saber',
                        type: ActivityType.Playing
                    }
                ],
                status: PresenceUpdateStatus.DoNotDisturb
            })
        
            Logger.log('Application', 'INFO', 'Le bot est prêt !')
        })
        
        client.login(config.token)
    } catch(error) {
        Logger.log('Discord', 'ERROR', `Une erreur est survenue : ${error.message}`)
    }
} catch(error) {
    Logger.log('Application', 'ERROR', `Démarrage du bot impossible : ${error.message}`)
}