import { GuildMember } from 'discord.js'
import players from '../controllers/players.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import Logger from '../utils/logger.js'

export default class guildMemberRemove {
    private static member: GuildMember

    /**
     * Emitted whenever a member leaves a guild, or is kicked
     * @param member The member that has left/been kicked from the guild
     */
    static async execute(member: GuildMember) {
        this.member = member

        await players.remove(member.id, Leaderboards.ScoreSaber)
        await players.remove(member.id, Leaderboards.BeatLeader)

        Logger.log('EventManager', 'INFO', `Le membre "${member.user.username}" vient de quitter le serveur. Celui-ci a été supprimé du classement de Cube-Stalker.`)
    }
}