import { Collection, GuildMember } from 'discord.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
import { GameLeaderboard, Leaderboards } from './gameLeaderboard.js'
import roles from './roles.js'
import { PlayerData, PlayerRanking } from '../interfaces/player.interface.js'
import { PlayerModel, LeaderboardModel } from './database.js'
import { LeaderboardError } from '../utils/error.js'
import Logger from '../utils/logger.js'

export default class Leaderboard {
    /**
     * Récéupration du classement serveur global
     * @param leaderboardName choix du leaderboard
     * @param type type de classement (pp ou acc)
     * @param page page à afficher (10 éléments par page)
     * @returns classement serveur global
     */
    static async getLeaderboard(leaderboardName: Leaderboards, type: string, page: number) {
        // Récupération du classement
        const itemsPerPage = 10
        
        const leaderboardCount = await LeaderboardModel.count({ where: { leaderboard: leaderboardName } })

        if(leaderboardCount == 0)
            throw new LeaderboardError('Aucune donnée de classement disponible.')

        const pageCount = Math.ceil(leaderboardCount / itemsPerPage)

        if(page > pageCount)
            throw new LeaderboardError('La page demandée n\'existe pas.')

        const ld = await LeaderboardModel.findAll({
            where: { leaderboard: leaderboardName },
            order: type === 'pp' ? [[ 'pp', 'DESC' ], [ 'id', 'ASC' ]] : [[ 'averageRankedAccuracy', 'DESC' ], [ 'id', 'ASC' ]],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        let playersList = ''
        for(let i = 0; i < ld.length; i++) {
            const ml = ld[i]
            const pos = (page - 1) * itemsPerPage + i + 1
            const rank = `#${pos}`.replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')
            const pp = new Intl.NumberFormat('en-US').format(ml.pp) + 'pp'
            const acc = (ml.averageRankedAccuracy).toFixed(2) + '%'
            const stat = type == 'pp' ? pp : acc
            const leaderboardUrl = `https://${leaderboardName === Leaderboards.ScoreSaber ? 'scoresaber.com' : 'beatleader.xyz'}/u/${ml.playerId}`
            playersList += `${rank} - ${ml.playerCountry !== '' ? countryCodeEmoji(ml.playerCountry) : '🏴‍☠️'} [${ml.playerName}](${leaderboardUrl}) - ${stat}\n`
        }

        const pageInfo = `Page \`${page}\` sur \`${pageCount}\``

        return {
            title: 'Classement ' + (type == 'pp' ? 'PP' : 'Précision') + ` Serveur (${leaderboardCount} joueurs)`,
            content: playersList + '\n' + pageInfo
        }
    }

    /**
     * Récupération du classement global
     * @param leaderboardName choix du leaderboard
     * @param count nombre de joueurs à récupérer
     * @returns liste des meilleurs joueurs au classement mondial
     */
    static async getGlobalLeaderboard(leaderboardName: Leaderboards, count: number) {
        let playersList = ''

        const gameLd = new GameLeaderboard(leaderboardName)
        const global = await gameLd.requests.getGlobal(1)
        
        for(let i = 0; i < count; i++) {
            const gl = global[i]
            const r = `#${gl.rank}`.replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')
            const pp = new Intl.NumberFormat('en-US').format(gl.pp ?? 0)
            playersList += `${r} - ${gl.country && gl.country !== '' ? countryCodeEmoji(gl.country) : '🏴‍☠️'} [${gl.name}](${gl.url}) - ${pp}pp\n`
        }

        return playersList
    }

    /**
     * Récupération du classement global sur la position d'un joueur par rapport à son rang
     * @param leaderboardName choix du leaderboard
     * @param rank rang du joueur
     * @returns liste des joueurs
     */
    static async getGlobalLeaderboardByPlayerRank(leaderboardName: Leaderboards, rank: number) {
        const playersPerPage = 50
        const page = Math.ceil(rank / 50)
        let pos = rank % playersPerPage === 1 ? 0 : (rank % playersPerPage === 0 ? playersPerPage - 1 : rank % playersPerPage - 1)

        const gameLd = new GameLeaderboard(leaderboardName)
        let ld = await gameLd.requests.getGlobal(page)

        let start = pos - 5 >= 0 ? pos - 5 : pos
        if(pos - 5 < 0 && page > 1) {
            const _ld = await gameLd.requests.getGlobal(page - 1)
            ld = _ld.concat(ld)
            pos += playersPerPage
            start = pos - 5
        }
        if(pos + 5 > ld.length - 1) {
            let _ld = await gameLd.requests.getGlobal(page + 1)
            if(_ld.length > 0) {
                ld = ld.concat(_ld)
            } else {
                start = pos + (ld.length - pos - 11)
                if(start < 0) {
                    _ld = await gameLd.requests.getGlobal(page - 1)
                    ld = _ld.concat(ld)
                    start = playersPerPage + start
                }
            }
        }

        if(pos >= ld.length)
            throw new LeaderboardError('Aucun joueur trouvé à cette position du classement')

        let playersList = ''
        for(let i = start; i <= start + 10; i++) {
            const gl = ld[i]
            const r = `#${gl.rank}`.replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')
            const pp = new Intl.NumberFormat('en-US').format(gl.pp ?? 0)
            const bold = gl.rank === rank ? '**' : ''
            playersList += `${bold}${r} - ${gl.country && gl.country !== '' ? countryCodeEmoji(gl.country) : '🏴‍☠️'} [${gl.name}](${gl.url}) - ${pp}pp${bold}\n`
        }

        return playersList
    }

    /**
     * Récupération du classement global sur la position d'un joueur par rapport à son identifiant
     * @param leaderboardName choix du leaderboard
     * @param playerId identifiant du joueur
     * @returns liste des joueurs
     */
    static async getGlobalLeaderboardByPlayerId(leaderboardName: Leaderboards, playerId: string) {
        const gameLd = new GameLeaderboard(leaderboardName)
        const rank = await gameLd.requests.getPlayerRankById(playerId)
        if(!rank) throw new LeaderboardError('Récupération du rank du joueur impossible')

        return this.getGlobalLeaderboardByPlayerRank(leaderboardName, rank)
    }

    /**
     * Récupération du classement serveur d'un joueur
     * @param leaderboardName choix du leaderboard
     * @param playerId identifiant joueur
     * @returns classement serveur du joueur
     */
    static async getPlayerServerRanking(leaderboardName: Leaderboards, playerId: string) {
        // Récupération du classement
        const ld = await LeaderboardModel.findAll({
            where: { leaderboard: leaderboardName },
            order: [ [ 'pp', 'ASC' ] ]
        })

        // Récupération des rangs Discord du membre
        const serverRankPP = ld.sort((a, b) => b.pp - a.pp).findIndex(ld => ld.playerId === playerId && ld.leaderboard === leaderboardName)
        const serverRankAcc = ld.sort((a, b) => b.averageRankedAccuracy - a.averageRankedAccuracy).findIndex(ld => ld.playerId === playerId && ld.leaderboard === leaderboardName)

        if(serverRankPP === -1 || serverRankAcc === -1) return null

        return {
            serverRankPP: serverRankPP + 1,
            serverRankAcc: serverRankAcc + 1,
            serverLdTotal: ld.length
        }
    }

    /**
     * Récupération des données de classement d'un joueur
     * @param leaderboardName choix du leaderboard
     * @param memberId identifiant Discord du membre
     * @returns classement serveur du joueur
     */
    static async getPlayer(leaderboardName: Leaderboards, memberId: string): Promise<PlayerRanking | null> {
        // Récupération du classement
        const ld = await LeaderboardModel.findAll({
            where: { leaderboard: leaderboardName },
            order: [ [ 'pp', 'ASC' ] ]
        })

        // Récupération des données de classement du joueur
        const ldData = ld.find(l => l.memberId === memberId && l.leaderboard === leaderboardName)

        if(!ldData) return null

        return {
            pp: ldData.pp,
            rank: ldData.rank,
            countryRank: ldData.countryRank,
            averageRankedAccuracy: ldData.averageRankedAccuracy,
            serverRankPP: ldData.serverRankPP,
            serverRankAcc: ldData.serverRankAcc,
            serverLdTotal: ld.length
        }
    }

    /**
     * Ajout d'un joueur au classement serveur
     * @param leaderboardName choix du leaderboard
     * @param memberId identifiant Discord du membre
     * @param playerData données du profil ScoreSaber ou BeatLeader du joueur
     */
    static async addPlayerLeaderboard(leaderboardName: Leaderboards, memberId: string, playerData: PlayerData) {
        const playerLeaderboard = await LeaderboardModel.findOne({
            where: {
                memberId: memberId,
                leaderboard: leaderboardName
            }
        })

        if(!playerLeaderboard) {
            await LeaderboardModel.create({
                leaderboard: leaderboardName,
                memberId: memberId,
                playerId: playerData.id,
                playerName: playerData.name,
                playerCountry: playerData.country,
                pp: playerData.pp,
                rank: playerData.rank,
                countryRank: playerData.countryRank,
                averageRankedAccuracy: playerData.averageRankedAccuracy,
                serverRankAcc: 0,
                serverRankPP: 0
            })

            const playerLd = await this.getPlayerServerRanking(leaderboardName, playerData.id)

            if(playerLd) {
                await LeaderboardModel.update({
                    serverRankPP: playerLd.serverRankPP,
                    serverRankAcc: playerLd.serverRankAcc
                }, {
                    where: {
                        memberId: memberId,
                        leaderboard: leaderboardName
                    }
                })
            }
        }
    }

    /**
     * Mise à jour du classement serveur d'un joueur
     * @param leaderboardName choix du leaderboard
     * @param memberId identifiant Discord du membre
     * @param playerData données du profil ScoreSaber ou BeatLeader du joueur
     */
    static async updatePlayerLeaderboard(leaderboardName: Leaderboards, memberId: string, playerData: PlayerData) {
        const playerLeaderboard = await LeaderboardModel.findOne({
            where: {
                memberId: memberId,
                leaderboard: leaderboardName
            }
        })

        if(playerLeaderboard) {
            await LeaderboardModel.update({
                playerId: playerData.id,
                playerName: playerData.name,
                playerCountry: playerData.country,
                pp: playerData.pp,
                rank: playerData.rank,
                countryRank: playerData.countryRank,
                averageRankedAccuracy: playerData.averageRankedAccuracy
            }, {
                where: {
                    memberId: memberId,
                    leaderboard: leaderboardName
                }
            })

            const playerLd = await this.getPlayerServerRanking(leaderboardName, playerData.id)

            if(playerLd) {
                await LeaderboardModel.update({
                    serverRankPP: playerLd.serverRankPP,
                    serverRankAcc: playerLd.serverRankAcc
                }, {
                    where: {
                        memberId: memberId,
                        leaderboard: leaderboardName
                    }
                })
            }
        }
    }

    /**
     * Suppression du classement serveur d'un joueur
     * @param leaderboardName choix du leaderboard
     * @param playerId identifiant du joueur
     */
    static async removePlayerLeaderboard(leaderboardName: Leaderboards, playerId: string) {
        await LeaderboardModel.destroy({
            where: {
                playerId: playerId,
                leaderboard: leaderboardName
            }
        })
    }

    /**
     * Actualise le classement de tous les membres du serveur puis met à jour leurs rôles de pp
     * @param leaderboardName choix du leaderboard
     * @param members liste des membres de la guild
     */
    static async refreshLeaderboard(leaderboardName: Leaderboards, members: Collection<string, GuildMember>) {
        const players = await LeaderboardModel.findAll({
            where: {
                leaderboard: leaderboardName
            }
        })

        for(const p of players) {
            Logger.log('Leaderboard', 'INFO', `Actualisation du joueur "${p.playerName}"...`)

            const gameLd = new GameLeaderboard(leaderboardName)
            const playerData = await gameLd.requests.getPlayerData(p.playerId)

            if(!playerData.banned) {
                await this.updatePlayerLeaderboard(leaderboardName, p.memberId, playerData)
            } else {
                await PlayerModel.destroy({ where: { memberId: p.memberId } })
                await LeaderboardModel.destroy({ where: { memberId: p.memberId } })
            }

            const member = members.find(m => m.id === p.memberId)

            if(member) {
                const pp = playerData.banned ? 0 : playerData.pp
                await roles.updateMemberPpRoles(member, pp)

                Logger.log('Leaderboard', 'INFO', `Actualisation du joueur "${p.playerName}" terminée`)
            } else {
                Logger.log('Leaderboard', 'WARNING', `Le joueur "${p.playerName}" est introuvable`)
            }
        }
    }
}