const fs = require("fs");

class Logger {
    log(log) {
        let rawDate = new Date()
        let date = rawDate.getFullYear() + '-' + ("0" + (rawDate.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + rawDate.getDate()).slice(-2)
        let time = ("0" + rawDate.getHours()).slice(-2) + ":" + ("0" + rawDate.getMinutes()).slice(-2) + ":" + ("0" + rawDate.getSeconds()).slice(-2)

        // Un fichier par jour, une ligne contient l'heure.
        fs.appendFileSync("logs/" + date + ".log", "[" + time + "] " + log + "\n");

        // On l'affiche dans la console pour voir rapidement si tout est ok
        console.log(log)
    }
}

module.exports = Logger;