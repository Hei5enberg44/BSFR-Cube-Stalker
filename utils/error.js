const Logger = require('./logger')

class DatabaseError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

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

class Top1Error extends Error {
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

class BeatLeaderError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
        Logger.log('ScoreSaber', 'ERROR', message)
    }
}

class BeatSaverError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
        Logger.log('ScoreSaber', 'ERROR', message)
    }
}

module.exports = {
    DatabaseError, CommandError, CommandInteractionError, MemberError, LeaderboardError, Top1Error, CooldownError, ScoreSaberError, BeatLeaderError, BeatSaverError
}