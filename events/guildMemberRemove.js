const players = require('../controllers/players')
const Logger = require('../utils/logger')

module.exports = {
    /**
     * Emitted whenever a member leaves a guild, or is kicked
     * @param {GuildMember} member The member that has left/been kicked from the guild
     */
    async execute(member) {
        const memberId = member.id
        const memberTag = member.user.tag

        await players.remove(memberId)

        Logger.log('EventManager', 'INFO', `Le membre "${memberTag}" vient de quitter le serveur. Celui-ci a été supprimé du classement de Cube Stalker.`)
    }
}