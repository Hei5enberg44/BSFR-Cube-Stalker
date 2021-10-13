const Logger = require('./logger')

class CommandError extends Error {
    constructor(message, commandName) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
        Logger.log('CommandManager', 'INFO', `L\'exécution de la commande "/${commandName}" a échoué : ${(message).replace(/:[^:]+:\s/g, '').replace('\n', ' ')}`)
    }
}

class CommandInteractionError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class MemberError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class LeaderboardError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class CooldownError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class ScoreSaberError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
        Logger.log('ScoreSaber', 'ERROR', message)
    }
}

module.exports = {
    CommandError, CommandInteractionError, MemberError, LeaderboardError, CooldownError, ScoreSaberError
}