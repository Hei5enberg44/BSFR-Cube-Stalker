import { existsSync, mkdirSync, appendFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default class Logger {
    private static logPath = resolve(__dirname, `../logs`)

    /**
     * Retourne la date actuelle
     */
    static date(): { date: string; time: string } {
        const d = new Date()
        const year = d.getFullYear()
        const month =
            d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1
        const date = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate()
        const hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours()
        const minutes =
            d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes()
        const seconds =
            d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()

        return {
            date: `${year}-${month}-${date}`,
            time: `${hours}:${minutes}:${seconds}`
        }
    }

    /**
     * Redirige les logs vers un fichier horodaté
     * Les logs sont ensuite retournés dans la console
     * @param scope provenance du log
     * @param level niveau de log (INFO, WARNING, ERROR)
     * @param content log à formatter
     */
    static log(
        scope: string,
        level: 'INFO' | 'WARNING' | 'ERROR',
        content: string
    ) {
        const date = this.date()

        const _scope = chalk.blackBright(scope)
        const _date = `${chalk.yellow(date.date)} ${chalk.yellow(date.time)}`

        let _level: string
        switch (level) {
            case 'INFO':
                _level = chalk.blueBright(level)
                break
            case 'WARNING':
                _level = chalk.yellowBright(level)
                break
            case 'ERROR':
                _level = chalk.redBright(level)
                break
            default:
                _level = chalk.blueBright(level)
        }

        if (!existsSync(this.logPath)) mkdirSync(this.logPath)
        appendFileSync(
            resolve(this.logPath, `${date.date}.log`),
            `[${date.date} ${date.time}] [${scope}] [${level}] ${content}\n`
        )
        console.log(`[${_date}] [${_scope}] [${_level}] ${content}`)
    }

    /**
     * Récupère un fichier de log
     * @param date date du log
     * @returns chemin du fichier de log
     */
    static get(date: string) {
        const logFile = resolve(this.logPath, `${date}.log`)
        if (!existsSync(logFile)) return null
        return logFile
    }
}
