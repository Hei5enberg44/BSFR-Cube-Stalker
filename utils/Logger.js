const Filesystem = require("fs");

class Logger {

    log(t) {
        Filesystem.appendFileSync("log.txt", t + "\n");
        console.log(t);
    }

}

module.exports = Logger;