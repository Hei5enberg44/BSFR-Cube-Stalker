import { Collection, GuildMember } from 'discord.js'
import { LeaderboardError } from '../utils/error.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
import Logger from '../utils/logger.js'
import scoresaber from './scoresaber.js'
import beatleader from '../controllers/beatleader.js'
import roles from './roles.js'
import { Players, Leaderboard } from './database.js'

export default {
    _leaderboard(leaderboardName) {
        if(leaderboardName === 'scoresaber') {
            return scoresaber
        } else if(leaderboardName === 'beatleader') {
            return beatleader
        }
        return null
    },

    /**
     * Récéupration du classement serveur global
     * @param {string} leaderboardName choix du leaderboard
     * @param {string} type type de classement (pp ou acc)
     * @param {number} page page à afficher (10 éléments par page)
     * @returns {Promise<{title: string, content: string}>} classement serveur global
     */
    async getLeaderboard(leaderboardName, type, page) {
        // Récupération du classement
        const itemsPerPage = 10
        
        const leaderboardCount = await Leaderboard.count({ where: { leaderboard: leaderboardName } })

        if(leaderboardCount == 0)
            throw new LeaderboardError('Aucune donnée de classement disponible.')

        const pageCount = Math.ceil(leaderboardCount / itemsPerPage)

        if(page > pageCount)
            throw new LeaderboardError('La page demandée n\'existe pas.')

        const sort = type == 'pp' ? [[ 'pp', 'DESC' ], [ 'id', 'ASC' ]] : [[ 'averageRankedAccuracy', 'DESC' ], [ 'id', 'ASC' ]]
        const ld = await Leaderboard.findAll({
            where: { leaderboard: leaderboardName },
            order: sort,
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
            const leaderboardUrl = `https://${leaderboardName === 'scoresaber' ? 'scoresaber.com' : 'beatleader.xyz'}/u/${ml.playerId}`
            playersList += `${rank} - ${ml.playerCountry !== '' ? countryCodeEmoji(ml.playerCountry) : '🏴‍☠️'} [${ml.playerName}](${leaderboardUrl}) - ${stat}\n`
        }

        const pageInfo = `Page \`${page}\` sur \`${pageCount}\``

        return {
            title: 'Classement ' + (type == 'pp' ? 'PP' : 'Précision') + ` Serveur (${leaderboardCount} joueurs)`,
            content: playersList + '\n' + pageInfo
        }
    },

    /**
     * Récupération du classement global
     * @param {string} leaderboardName choix du leaderboard
     * @param {number} count nombre de joueurs à récupérer
     * @returns {Promise<string>} liste des meilleurs joueurs au classement mondial
     */
    async getGlobalLeaderboard(leaderboardName, count) {
        const leaderboard = this._leaderboard(leaderboardName)

        const ld = await leaderboard.getGlobal(1)
        
        let playersList = ''
        for(let i = 0; i < count; i++) {
            const gl = ld[i]
            const r = `#${gl.rank}`.replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')
            const pp = new Intl.NumberFormat('en-US').format(gl.pp)
            playersList += `${r} - ${gl.country !== '' ? countryCodeEmoji(gl.country) : '🏴‍☠️'} [${gl.name}](${gl.url}) - ${pp}pp\n`
        }

        return playersList
    },

    /**
     * Récupération du classement global sur la position d'un joueur par rapport à son rang
     * @param {string} leaderboardName choix du leaderboard
     * @param {number} rank rang du joueur
     * @returns {Promise<string>} liste des joueurs
     */
    async getGlobalLeaderboardByPlayerRank(leaderboardName, rank) {
        const leaderboard = this._leaderboard(leaderboardName)

        const playersPerPage = 50
        const page = Math.ceil(rank / 50)
        let pos = rank % playersPerPage === 1 ? 0 : (rank % playersPerPage === 0 ? playersPerPage - 1 : rank % playersPerPage - 1)

        let ld = await leaderboard.getGlobal(page)

        let start = pos - 5 >= 0 ? pos - 5 : pos
        if(pos - 5 < 0 && page > 1) {
            const _ld = await leaderboard.getGlobal(page - 1)
            ld = _ld.concat(ld)
            pos += playersPerPage
            start = pos - 5
        }
        if(pos + 5 > ld.length - 1) {
            let _ld = await leaderboard.getGlobal(page + 1)
            if(_ld.length > 0) {
                ld = ld.concat(_ld)
            } else {
                start = pos + (ld.length - pos - 11)
                if(start < 0) {
                    _ld = await leaderboard.getGlobal(page - 1)
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
            const pp = new Intl.NumberFormat('en-US').format(gl.pp)
            const bold = gl.rank === rank ? '**' : ''
            playersList += `${bold}${r} - ${gl.country !== '' ? countryCodeEmoji(gl.country) : '🏴‍☠️'} [${gl.name}](${gl.url}) - ${pp}pp${bold}\n`
        }

        return playersList
    },

    /**
     * Récupération du classement global sur la position d'un joueur par rapport à son identifiant
     * @param {string} leaderboardName choix du leaderboard
     * @param {string} playerId identifiant du joueur
     * @returns {Promise<string>} liste des joueurs
     */
    async getGlobalLeaderboardByPlayerId(leaderboardName, playerId) {
        const leaderboard = this._leaderboard(leaderboardName)
        const rank = await leaderboard.getPlayerRankById(playerId)

        return this.getGlobalLeaderboardByPlayerRank(leaderboardName, rank)
    },

    /**
     * @typedef {Object} ServerPlayerRanking
     * @property {number} serverRankPP
     * @property {number} serverRankAcc
     * @property {number} serverLdTotal
     */

    /**
     * Récupération du classement serveur d'un joueur
     * @param {string} playerId identifiant joueur
     * @param {string} leaderboardName nom du leaderboard
     * @returns {Promise<(ServerPlayerRanking|null)>} classement serveur du joueur
     */
    async getPlayerLeaderboard(playerId, leaderboardName) {
        // Récupération du classement
        const ld = await Leaderboard.findAll({
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
    },

    /**
     * @typedef {Object} PlayerRanking
     * @property {number} pp
     * @property {number} rank
     * @property {number} countryRank
     * @property {number} averageRankedAccuracy
     * @property {number} serverRankPP
     * @property {number} serverRankAcc
     * @property {number} serverLdTotal
     */

    /**
     * Récupération des données de classement d'un joueur
     * @param {string} memberId identifiant Discord du membre
     * @param {string} leaderboardName nom du leaderboard
     * @returns {Promise<(PlayerRanking|null)>} classement serveur du joueur
     */
    async getPlayer(memberId, leaderboardName) {
        // Récupération du classement
        const ld = await Leaderboard.findAll({
            where: { leaderboard: leaderboardName },
            order: [ [ 'pp', 'ASC' ] ]
        })

        // Récupération des données de classement du joueur
        const ldDatas = ld.find(l => l.memberId === memberId && l.leaderboard === leaderboardName)

        if(!ldDatas) return null

        return {
            pp: ldDatas.pp,
            rank: ldDatas.rank,
            countryRank: ldDatas.countryRank,
            averageRankedAccuracy: ldDatas.averageRankedAccuracy,
            serverRankPP: ldDatas.serverRankPP,
            serverRankAcc: ldDatas.serverRankAcc,
            serverLdTotal: ld.length
        }
    },

    /**
     * Ajout d'un joueur au classement serveur
     * @param {string} memberId identifiant Discord du membre
     * @param {string} leaderboardName nom du leaderboard
     * @param {Object} playerDatas données du profil ScoreSaber ou BeatLeader du joueur
     * @returns {Promise<(PlayerRanking|null)>} classement serveur du joueur
     */
    async addPlayerLeaderboard(memberId, leaderboardName, playerDatas) {
        const playerLeaderboard = await Leaderboard.findOne({
            where: {
                memberId: memberId,
                leaderboard: leaderboardName
            }
        })

        if(!playerLeaderboard) {
            await Leaderboard.create({
                leaderboard: leaderboardName,
                memberId: memberId,
                playerId: playerDatas.id,
                playerName: playerDatas.name,
                playerCountry: playerDatas.country,
                pp: playerDatas.pp,
                rank: playerDatas.rank,
                countryRank: playerDatas.countryRank,
                averageRankedAccuracy: playerDatas.averageRankedAccuracy,
                serverRankAcc: 0,
                serverRankPP: 0
            })

            const playerLd = await this.getPlayerLeaderboard(playerDatas.id, leaderboardName)

            await Leaderboard.update({
                serverRankPP: playerLd.serverRankPP,
                serverRankAcc: playerLd.serverRankAcc
            }, {
                where: {
                    memberId: memberId,
                    leaderboard: leaderboardName
                }
            })
        }

        return this.getPlayer(memberId, leaderboardName)
    },

    /**
     * Mise à jour du classement serveur d'un joueur
     * @param {string} memberId identifiant Discord du membre
     * @param {string} leaderboardName nom du leaderboard
     * @param {Object} playerDatas données du profil ScoreSaber ou BeatLeader du joueur
     * @returns {Promise<(PlayerRanking|null)>} classement serveur du joueur
     */
    async updatePlayerLeaderboard(memberId, leaderboardName, playerDatas) {
        const playerLeaderboard = await Leaderboard.findOne({
            where: {
                memberId: memberId,
                leaderboard: leaderboardName
            }
        })

        if(playerLeaderboard) {
            const playerLd = await this.getPlayerLeaderboard(playerDatas.id, leaderboardName)

            await Leaderboard.update({
                playerId: playerDatas.id,
                playerName: playerDatas.name,
                playerCountry: playerDatas.country,
                pp: playerDatas.pp,
                rank: playerDatas.rank,
                countryRank: playerDatas.countryRank,
                averageRankedAccuracy: playerDatas.averageRankedAccuracy,
                serverRankPP: playerLd.serverRankPP,
                serverRankAcc: playerLd.serverRankAcc
            }, {
                where: {
                    memberId: memberId,
                    leaderboard: leaderboardName
                }
            })
        }

        return this.getPlayer(memberId, leaderboardName)
    },

    /**
     * Suppression du classement serveur d'un joueur
     * @param {string} playerId identifiant du joueur
     * @param {string} leaderboard nom du leaderboard
     */
    async removePlayerLeaderboard(playerId, leaderboard) {
        await Leaderboard.destroy({
            where: {
                playerId: playerId,
                leaderboard: leaderboard
            }
        })
    },

    /**
     * Actualise le classement de tous les membres du serveur puis met à jour leurs rôles de pp
     * @param {Collection<GuildMember>} members liste des membres de la guild
     * @param {string} leaderboardName nom du leaderboard
     */
    async refreshLeaderboard(members, leaderboardName = 'scoresaber') {
        const leaderboard = this._leaderboard(leaderboardName)

        const players = await Players.findAll({
            where: {
                leaderboard: leaderboardName
            }
        })

        for(const p of players) {
            Logger.log('Leaderboard', 'INFO', `Actualisation du joueur "${p.playerName}"...`)

            const playerDatas = await leaderboard.getPlayerDatas(p.playerId)

            if(!playerDatas.banned) {
                await this.updatePlayerLeaderboard(p.memberId, leaderboardName, playerDatas)
            } else {
                await Players.destroy({ where: { memberId: p.memberId } })
                await Leaderboard.destroy({ where: { memberId: p.memberId } })
            }

            const member = members.find(m => m.id === p.memberId)

            if(member) {
                const pp = playerDatas.banned ? 0 : playerDatas.pp
                await roles.updateMemberPpRoles(member, pp)

                Logger.log('Leaderboard', 'INFO', `Actualisation du joueur "${p.playerName}" terminée`)
            } else {
                Logger.log('Leaderboard', 'WARNING', `Le joueur "${p.playerName}" est introuvable`)
            }
        }
    }
}