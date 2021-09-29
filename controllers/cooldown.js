const { CooldownError } = require('../utils/error')
const Database = require('./database')

function millisecondsToDate(m) {
    const d = new Date(m)

    const year = d.getFullYear()
    const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1
    const date = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate()
    const hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours()
    const minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes()
    const seconds = d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()

    return `${date}/${month}/${year} à ${hours}:${minutes}:${seconds}`
}

module.exports = {
    checkCooldown: async function(commandName, memberId, duration) {
        const client = new Database()

        try {
            const db = await client.connect()
            const c = db.collection('cooldown')

            const date = (new Date()).getTime()
        
            // On vérifie si le membre a déjà un cooldown et si celui-ci est expiré
            const cd = await c.findOne({ commandName: commandName, memberId: memberId })
            if(cd) {
                if(cd.expirationDate > date) throw new CooldownError(`Vous ne pouvez pas encore exécuter la commande \`/${commandName}\`\nVous pourrez exécuter cette commande de nouveau le \`${millisecondsToDate(cd.expirationDate)}\``)
            }

            const expirationDate = date + (duration * 1000)

            return {
                timestamp: expirationDate,
                date: millisecondsToDate(expirationDate)
            }
        } finally {
            client.close()
        }
    },

    addCooldown: async function(commandName, memberId, expirationDate) {
        const client = new Database()

        try {
            const db = await client.connect()
            const c = db.collection('cooldown')

            await c.updateOne(
                {
                    memberId: memberId,
                },
                {
                    $set: {
                        commandName: commandName,
                        memberId: memberId,
                        expirationDate: expirationDate
                    }
                },
                { upsert: true }
            )
        } finally {
            client.close()
        }
    }
}