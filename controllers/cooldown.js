const { CooldownError } = require('../utils/error')
const { Cooldowns } = require('./database')
const { Op } = require('sequelize')

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
        const date = Math.floor(new Date().getTime() / 1000)
        
        // On vérifie si le membre a déjà un cooldown et si celui-ci est expiré
        const cd = await Cooldowns.findOne({
            where: {
                [Op.and]: [
                    { commandName: commandName },
                    { memberId: memberId }
                ]
            }
        })

        if(cd) {
            if(cd.expirationDate > date) throw new CooldownError(`Vous ne pouvez pas encore exécuter la commande \`/${commandName}\`\nVous pourrez exécuter cette commande de nouveau le \`${millisecondsToDate(cd.expirationDate)}\``)
        }

        const expirationDate = date + duration

        return {
            timestamp: expirationDate,
            date: millisecondsToDate(expirationDate)
        }
    },

    addCooldown: async function(commandName, memberId, expirationDate) {
        const cd = await Cooldowns.findOne({
            where: {
                [Op.and]: [
                    { memberId: memberId },
                    { commandName: commandName }
                ]
            }
        })

        if(!cd) {
            Cooldowns.create({
                commandName: commandName,
                memberId: memberId,
                expirationDate: expirationDate
            })
        } else {
            cd.expirationDate = expirationDate
            await cd.save()
        }
    }
}