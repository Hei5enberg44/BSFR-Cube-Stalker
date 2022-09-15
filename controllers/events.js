import Logger from '../utils/logger.js'
import * as fs from 'node:fs'

export default class Events {
    /**
     * @param {Client} client client Discord
     */
    constructor(client) {
        this.client = client
    }

    /**
     * Chargement des écoutes d'évènements au démarrage du Bot
     */
    async load() {
        const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))

        for(const file of eventFiles) {
            const { default: event } = await import(`../events/${file}`)
            if(event.disabled) return
            const name = event.name || file.split('.')[0]
            const emitter = (typeof event.emitter === 'string' ? this.client[event.emitter] : event.emitter) || this.client
            const once = event.once

            Logger.log('EventManager', 'INFO', `Évènement "${name}" trouvé`)

            try {
                emitter[once ? 'once' : 'on'](name, (...args) => event.execute(...args))
            } catch(error) {
                console.error(error.stack)
            }
        }
    }
}