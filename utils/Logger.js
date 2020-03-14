const Filesystem = require("fs");

class Logger {

    /**
     * Permet de log le debug dans le fichier log.txt de la racine.
     * @param t
     */
    log(t) {
        Filesystem.appendFileSync("log.txt", t + "\n");
        console.log(t);
    }

}

module.exports = Logger;