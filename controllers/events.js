const Logger = require('../utils/logger')
const fs = require('fs')

class Events {
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
            const eventFunction = require(`../events/${file}`)
            if (eventFunction.disabled) return
            const name = eventFunction.name || file.split('.')[0]
            const emitter = (typeof eventFunction.emitter === 'string' ? this.client[eventFunction.emitter] : eventFunction.emitter) || this.client
            const once = eventFunction.once

            Logger.log('EventManager', 'INFO', `Évènement "${name}" trouvé`)

            try {
                emitter[once ? 'once' : 'on'](name, (...args) => eventFunction.execute(...args))
            } catch(error) {
                console.error(error.stack)
            }
        }
    }
}

module.exports = Events