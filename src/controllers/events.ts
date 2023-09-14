import * as fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, ClientEvents } from 'discord.js'
import Logger from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default class Events {
    client: Client

    /**
     * @param client client Discord
     */
    constructor(client: Client) {
        this.client = client
    }

    /**
     * Chargement des écoutes d'évènements au démarrage du Bot
     */
    async load() {
        const eventFiles = fs.readdirSync(resolve(__dirname, '../events')).filter(file => file.endsWith('.js'))

        for(const file of eventFiles) {
            const { default: event } = await import(`../events/${file}`)
            if(event.disabled) return
            const name = event.name || file.split('.')[0]
            const emitter = (typeof event.emitter === 'string' ? this.client[<('on' | 'once' | 'off')>event.emitter] : event.emitter) || this.client
            const once = event.once

            Logger.log('EventManager', 'INFO', `Évènement "${name}" trouvé`)

            try {
                emitter[once ? 'once' : 'on'](name, (...args: (keyof ClientEvents)[]) => event.execute(...args))
            } catch(error) {
                console.error(error.stack)
            }
        }
    }
}