const fs = require('fs')

module.exports = {
    /**
     * Retourne la date actuelle
     */
    date: function() {
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
     * @param {string} content log à formatter
     * @returns {string} logs formattées
     */
    log: function(content) {
        const date = module.exports.date()
        fs.appendFileSync(`${__dirname}/../logs/${date.date}.log`, `[${date.time}] ${content}\n`)
        console.log(content)
    }
}