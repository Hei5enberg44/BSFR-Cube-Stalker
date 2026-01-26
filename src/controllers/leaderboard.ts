import { Collection, GuildMember } from 'discord.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
import { GameLeaderboard, Leaderboards } from './gameLeaderboard.js'
import roles from './roles.js'
import { PlayerModel } from '../models/player.model.js'
import { LeaderboardError } from '../utils/error.js'
import Logger from '../utils/logger.js'

export default class Leaderboard {
    /**
     * Récéupration du classement serveur global
     * @param leaderboardName choix du leaderboard
     * @param type type de classement (pp ou acc)
     * @param page page à afficher
     * @param itemsPerPage nombre d'éléments par page (default: 10)
     * @returns classement serveur global
     */
    static async getLeaderboard(
        leaderboardName: Leaderboards,
        type: string,
        page: number,
        itemsPerPage: number = 10
    ) {
        // Récupération du classement
        const leaderboardCount = await PlayerModel.count({
            where: { leaderboard: leaderboardName }
        })

        if (leaderboardCount == 0)
            throw new LeaderboardError(
                'Aucune donnée de classement disponible.'
            )

        const pageCount = Math.ceil(leaderboardCount / itemsPerPage)

        if (page > pageCount)
            throw new LeaderboardError("La page demandée n'existe pas.")

        const ld = await PlayerModel.findAll({
            where: { leaderboard: leaderboardName },
            order:
                type === 'points'
                    ? [
                          ['points', 'DESC'],
                          ['id', 'ASC']
                      ]
                    : [
                          ['averageRankedAccuracy', 'DESC'],
                          ['id', 'ASC']
                      ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        let playersList = ''
        for (let i = 0; i < ld.length; i++) {
            const ml = ld[i]
            const pos = (page - 1) * itemsPerPage + i + 1
            const rank = `#${pos}`
                .replace(/^#1$/, '🥇')
                .replace(/^#2$/, '🥈')
                .replace(/^#3$/, '🥉')
            const points = new Intl.NumberFormat('en-US').format(ml.points) + (leaderboardName !== Leaderboards.AccSaber ? 'pp' : 'ap')
            const acc = ml.averageRankedAccuracy.toFixed(2) + '%'
            const stat = type == 'points' ? points : acc
            const leaderboardUrl = `https://${leaderboardName.toLowerCase()}.com/${leaderboardName === Leaderboards.AccSaber ? 'profile' : 'u'}/${ml.playerId}`
            playersList += `${rank} — ${ml.playerCountry && ml.playerCountry !== '' ? countryCodeEmoji(ml.playerCountry) : '🏴‍☠️'} [${ml.playerName}](${leaderboardUrl}) — ${stat}\n`
        }

        return { content: playersList, page, pageCount }
    }

    /**
     * Récupération du classement global
     * @param leaderboardName choix du leaderboard
     * @param count nombre de joueurs à récupérer
     * @returns liste des meilleurs joueurs au classement mondial
     */
    static async getGlobalLeaderboard(
        leaderboardName: Leaderboards,
        count: number
    ) {
        let playersList = ''

        const gameLd = new GameLeaderboard(leaderboardName)
        const global = await gameLd.requests.getGlobal(1)

        for (let i = 0; i < count; i++) {
            const gl = global[i]
            const r = `#${gl.rank}`
                .replace(/^#1$/, '🥇')
                .replace(/^#2$/, '🥈')
                .replace(/^#3$/, '🥉')
            const points = new Intl.NumberFormat('en-US').format(gl.points ?? 0)
            playersList += `${r} — ${gl.country && gl.country !== '' ? countryCodeEmoji(gl.country) : '🏴‍☠️'} [${gl.name}](${gl.url}) — ${points}${leaderboardName !== Leaderboards.AccSaber ? 'pp' : 'ap'}\n`
        }

        return playersList
    }

    /**
     * Récupération du classement global sur la position d'un joueur par rapport à son rang
     * @param leaderboardName choix du leaderboard
     * @param rank rang du joueur
     * @returns liste des joueurs
     */
    static async getGlobalLeaderboardByPlayerRank(
        leaderboardName: Leaderboards,
        rank: number
    ) {
        const playersPerPage = 50
        const page = Math.ceil(rank / 50)
        let pos =
            rank % playersPerPage === 1
                ? 0
                : rank % playersPerPage === 0
                  ? playersPerPage - 1
                  : (rank % playersPerPage) - 1

        const gameLd = new GameLeaderboard(leaderboardName)
        let ld = await gameLd.requests.getGlobal(page)

        let start = pos - 5 >= 0 ? pos - 5 : pos
        if (pos - 5 < 0 && page > 1) {
            const _ld = await gameLd.requests.getGlobal(page - 1)
            ld = _ld.concat(ld)
            pos += playersPerPage
            start = pos - 5
        }
        if (pos + 5 > ld.length - 1) {
            let _ld = await gameLd.requests.getGlobal(page + 1)
            if (_ld.length > 0) {
                ld = ld.concat(_ld)
            } else {
                start = pos + (ld.length - pos - 11)
                if (start < 0) {
                    _ld = await gameLd.requests.getGlobal(page - 1)
                    ld = _ld.concat(ld)
                    start = playersPerPage + start
                }
            }
        }

        if (pos >= ld.length)
            throw new LeaderboardError(
                'Aucun joueur trouvé à cette position du classement'
            )

        let playersList = ''
        for (let i = start; i <= start + 10; i++) {
            const gl = ld[i]
            const r = `#${gl.rank}`
                .replace(/^#1$/, '🥇')
                .replace(/^#2$/, '🥈')
                .replace(/^#3$/, '🥉')
            const points = new Intl.NumberFormat('en-US').format(gl.points ?? 0)
            const bold = gl.rank === rank ? '**' : ''
            playersList += `${bold}${r} — ${gl.country && gl.country !== '' ? countryCodeEmoji(gl.country) : '🏴‍☠️'} [${gl.name}](${gl.url}) — ${points}${leaderboardName !== Leaderboards.AccSaber ? 'pp' : 'ap'}${bold}\n`
        }

        return playersList
    }

    /**
     * Récupération du classement global sur la position d'un joueur par rapport à son identifiant
     * @param leaderboardName choix du leaderboard
     * @param playerId identifiant du joueur
     * @returns liste des joueurs
     */
    static async getGlobalLeaderboardByPlayerId(
        leaderboardName: Leaderboards,
        playerId: string
    ) {
        const gameLd = new GameLeaderboard(leaderboardName)
        const rank = await gameLd.requests.getPlayerRankById(playerId)
        if (!rank)
            throw new LeaderboardError(
                'Récupération du rang du joueur impossible'
            )

        return this.getGlobalLeaderboardByPlayerRank(leaderboardName, rank)
    }

    /**
     * Actualise le classement de tous les membres du serveur puis met à jour leurs rôles de pp
     * @param leaderboardName choix du leaderboard
     * @param members liste des membres de la guild
     */
    static async refreshLeaderboard(
        leaderboardName: Leaderboards,
        members: Collection<string, GuildMember>
    ) {
        const players = await PlayerModel.findAll({
            where: { leaderboard: leaderboardName }
        })

        for (const p of players) {
            Logger.log(
                'Leaderboard',
                'INFO',
                `Actualisation du joueur "${p.playerName}" en cours`
            )

            const gameLd = new GameLeaderboard(leaderboardName)
            const playerData = await gameLd.requests.getPlayerData(p.playerId)

            if (playerData.banned)
                await PlayerModel.destroy({ where: { memberId: p.memberId } })

            const member = members.find((m) => m.id === p.memberId)

            if (member) {
                const points = playerData.banned ? 0 : playerData.points
                await roles.updateMemberPpRoles(leaderboardName, member, points)

                Logger.log(
                    'Leaderboard',
                    'INFO',
                    `Actualisation du joueur "${p.playerName}" terminée`
                )
            } else {
                Logger.log(
                    'Leaderboard',
                    'WARNING',
                    `Le joueur "${p.playerName}" est introuvable`
                )
            }
        }
    }
}
