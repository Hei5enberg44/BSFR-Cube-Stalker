import { appendFileSync } from 'node:fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
    /**
     * Retourne la date actuelle
     */
    date() {
        const d = new Date()
        const year = d.getFullYear()
        const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1
        const date = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate()
        const hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours()
        const minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes()
        const seconds = d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()

        return {
            date: `${year}-${month}-${date}`,
            time: `${hours}:${minutes}:${seconds}`
        }
    },

    /**
     * Redirige les logs vers un fichier horodaté
     * Les logs sont ensuite retournés dans la console
     * @param {string} scope provenance du log
     * @param {string} level niveau de log (INFO, WARNING, ERROR)
     * @param {string} content log à formatter
     * @returns {string} logs formattées
     */
    log(scope, level, content) {
        const date = this.date()

        let logLevel
        switch(level) {
            case 'INFO':
                logLevel = chalk.blueBright(level)
                break
            case 'WARNING':
                logLevel = chalk.yellowBright(level)
                break
            case 'ERROR':
                logLevel = chalk.redBright(level)
                break
            default:
                logLevel = chalk.blueBright(level)
        }

        const logContent = `[${scope}] [${logLevel}] ${content}`

        appendFileSync(`${__dirname}/../logs/${date.date}.log`, `[${date.time}] [${scope}] [${level}] ${content}\n`)
        console.log(logContent)
    }
}