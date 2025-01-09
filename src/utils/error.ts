import Logger from './logger.js'

class ConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'CONFIG_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log('Config', 'ERROR', this.message)
    }
}

class DatabaseError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'DATABASE_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class CommandError extends Error {
    constructor(message: string, commandName: string) {
        super(message)
        this.name = 'COMMAND_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log('CommandManager', 'INFO', `L'exécution de la commande "/${commandName}" a échoué : ${(message).replace(/:[^:]+:\s/g, '').replace('\n', ' ')}`)
    }
}

class CommandInteractionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'COMMAND_INTERACTION_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class ModalError extends Error {
    constructor(message: string, modalName: string) {
        super(message)
        this.name = 'MODAL_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log('ModalManager', 'INFO', `La soumission de la modale "${modalName}" a échoué : ${(message).replace(/:[^:]+:\s/g, '').replace('\n', ' ')}`)
    }
}

class ModalSubmissionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'MODAL_SUBMISSION_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class PageNotFoundError extends Error {
    constructor() {
        super()
        this.name = 'PAGE_NOT_FOUND_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class PlayerError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'PLAYER_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class PlaylistError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'PLAYLIST_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class LeaderboardError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'LEADERBOARD_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class Top1Error extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'TOP1_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class CooldownError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'COOLDOWN_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class ScoreSaberError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SCORESABER_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log('ScoreSaber', 'ERROR', message)
    }
}

class BeatLeaderError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'BEATLEADER_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log('BeatLeader', 'ERROR', message)
    }
}

class BeatSaverError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'BEATSAVER_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log('ScoreSaber', 'ERROR', message)
    }
}

export {
    ConfigError,
    DatabaseError,
    CommandError,
    CommandInteractionError,
    ModalError,
    ModalSubmissionError,
    PageNotFoundError,
    PlayerError,
    PlaylistError,
    LeaderboardError,
    Top1Error,
    CooldownError,
    ScoreSaberError,
    BeatLeaderError,
    BeatSaverError
}