import players from '../controllers/players.js'
import Logger from '../utils/logger.js'

export default {
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