import { Op } from 'sequelize'
import { time, TimestampStyles } from 'discord.js'
import { CooldownModel } from './database.js'
import { CooldownError } from '../utils/error.js'

const millisecondsToDate = (m: number) => {
    const d = new Date(m * 1000)

    const year = d.getFullYear()
    const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1
    const date = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate()
    const hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours()
    const minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes()
    const seconds = d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()

    return `${date}/${month}/${year} à ${hours}:${minutes}:${seconds}`
}

export default class Cooldown {
    /**
     * Vérifie le cooldown d'une commande pour un membre
     * @param commandName nom de la commande
     * @param memberId identifiant du membre
     * @param duration durée du cooldown
     * @returns date d'expiration du cooldown
     */
    static async checkCooldown(commandName: string, memberId: string, duration: number) {
        const date = Math.floor(new Date().getTime() / 1000)
        
        // On vérifie si le membre a déjà un cooldown et si celui-ci est expiré
        const cd = await CooldownModel.findOne({
            where: {
                [Op.and]: [
                    { commandName: commandName },
                    { memberId: memberId }
                ]
            }
        })

        if(cd && cd.expirationDate > date)
            throw new CooldownError(`Vous ne pouvez pas encore exécuter la commande \`/${commandName}\`\nVous pourrez exécuter cette commande de nouveau \`${time(cd.expirationDate, TimestampStyles.RelativeTime)}\``)

        return date + duration
    }

    /**
     * Ajoute un cooldown sur une commande pour un membre
     * @param commandName nom de la commande
     * @param memberId identifiant du membre
     * @param expirationDate date d'expiration du cooldown (au format timestamp)
     */
    static async addCooldown(commandName: string, memberId: string, expirationDate: number) {
        const cd = await CooldownModel.findOne({
            where: {
                [Op.and]: [
                    { memberId: memberId },
                    { commandName: commandName }
                ]
            }
        })

        if(!cd) {
            CooldownModel.create({
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