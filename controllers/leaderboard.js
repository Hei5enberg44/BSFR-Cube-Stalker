const { Collection, GuildMember } = require('discord.js')
const { LeaderboardError } = require('../utils/error')
const { countryCodeEmoji } = require('../utils/country-code-emoji')
const Logger = require('../utils/logger')
const scoresaber = require('./scoresaber')
const beatleader = require('../controllers/beatleader')
const roles = require('./roles')
const { Leaderboard } = require('./database')

module.exports = {
    _leaderboard: function(leaderboardName) {
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
    getLeaderboard: async function(leaderboardName, type, page) {
        // Récupération du classement
        const itemsPerPage = 10
        
        const leaderboardCount = await Leaderboard.count({ where: { leaderboardName: leaderboardName } })

        if(leaderboardCount == 0)
            throw new LeaderboardError('Aucune donnée de classement disponible.')

        const pageCount = Math.ceil(leaderboardCount / itemsPerPage)

        if(page > pageCount)
            throw new LeaderboardError('La page demandée n\'existe pas.')

        const sort = type == 'pp' ? [[ 'pp', 'DESC' ], [ 'id', 'ASC' ]] : [[ 'averageRankedAccuracy', 'DESC' ], [ 'id', 'ASC' ]]
        const ld = await Leaderboard.findAll({
            where: { leaderboardName: leaderboardName },
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
            let leaderboardUrl
            if(leaderboardName === 'scoresaber') {
                leaderboardUrl = `https://scoresaber.com/u/${ml.playerId}`
            } else if(leaderboardName === 'beatleader') {
                leaderboardUrl = `https://beatleader.xyz/u/${ml.playerId}`
            }
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
    getGlobalLeaderboard: async function(leaderboardName, count) {
        const leaderboard = module.exports._leaderboard(leaderboardName)

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
    getGlobalLeaderboardByPlayerRank: async function(leaderboardName, rank) {
        const leaderboard = module.exports._leaderboard(leaderboardName)

        const playersPerPage = 50
        const page = Math.ceil(rank / 50)
        let pos = rank % playersPerPage === 1 ? 0 : (rank % playersPerPage === 0 ? playersPerPage - 1 : rank % playersPerPage - 1)

        let ld = await leaderboard.getGlobal(page)

        let start = pos - 5 >= 0 ? pos - 5 : pos
        if(pos - 5 < 0 && page > 1) {
            let _ld = await leaderboard.getGlobal(page - 1)
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
     * @param {string} playerId identifiant leaderboard du joueur
     * @returns {Promise<string>} liste des joueurs
     */
    getGlobalLeaderboardByPlayerId: async function(leaderboardName, playerId) {
        const leaderboard = module.exports._leaderboard(leaderboardName)
        const rank = await leaderboard.getPlayerRankById(playerId)

        return module.exports.getGlobalLeaderboardByPlayerRank(leaderboardName, rank)
    },

    /**
     * @typedef {Object} ServerMemberRanking
     * @property {number} serverRankPP
     * @property {number} serverRankAcc
     * @property {number} serverLdTotal
     */

    /**
     * Récupération du classement serveur d'un membre
     * @param {string} leaderboardName choix du leaderboard
     * @param {string} memberId identifiant Discord du membre
     * @returns {Promise<(ServerMemberRanking|null)>} classement serveur du membre
     */
    getMemberLeaderboard: async function(leaderboardName, memberId) {
        // Récupération du classement
        const ld = await Leaderboard.findAll({
            where: { leaderboardName: leaderboardName },
            order: [ [ 'pp', 'ASC' ] ]
        })

        // Récupération des rangs Discord du membre
        let serverRankPP = ld.sort((a, b) => b.pp - a.pp).findIndex(ld => ld.memberId == memberId)
        let serverRankAcc = ld.sort((a, b) => b.averageRankedAccuracy - a.averageRankedAccuracy).findIndex(ld => ld.memberId == memberId)

        if(serverRankPP === -1 || serverRankAcc === -1) return null

        return {
            serverRankPP: serverRankPP + 1,
            serverRankAcc: serverRankAcc + 1,
            serverLdTotal: ld.length
        }
    },

    /**
     * @typedef {Object} MemberRanking
     * @property {number} pp
     * @property {number} rank
     * @property {number} countryRank
     * @property {number} averageRankedAccuracy
     * @property {number} serverRankPP
     * @property {number} serverRankAcc
     * @property {number} serverLdTotal
     */

    /**
     * Récupération des données de classement d'un membre
     * @param {string} leaderboardName choix du leaderboard
     * @param {string} memberId identifiant Discord du membre
     * @returns {Promise<(MemberRanking|null)>} classement serveur du membre
     */
    getMember: async function(leaderboardName, memberId) {
        // Récupération du classement
        const ld = await Leaderboard.findAll({
            where: { leaderboardName: leaderboardName },
            order: [ [ 'pp', 'ASC' ] ]
        })

        // Récupération des données de classement du joueur
        const ldDatas = ld.find(l => l.memberId == memberId)

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
     * Ajout d'un membre au classement serveur
     * @param {string} leaderboardName choix du leaderboard
     * @param {string} memberId identifiant Discord du membre
     * @param {Object} playerDatas données du profil ScoreSaber ou BeatLeader du membre
     * @returns {Promise<(MemberRanking|null)>} classement serveur du membre
     */
    addMemberLeaderboard: async function(leaderboardName, memberId, playerDatas) {
        const leaderboardCount = await Leaderboard.findOne({
            where: {
                leaderboardName: leaderboardName,
                memberId: memberId
            }
        })

        if(!leaderboardCount) {
            await Leaderboard.create({
                leaderboardName: leaderboardName,
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

            const memberLd = await module.exports.getMemberLeaderboard(leaderboardName, memberId)

            await Leaderboard.update({
                serverRankPP: memberLd.serverRankPP,
                serverRankAcc: memberLd.serverRankAcc
            }, {
                where: {
                    leaderboardName: leaderboardName,
                    memberId: memberId
                }
            })
        }

        return module.exports.getMember(leaderboardName, memberId)
    },

    /**
     * Mise à jour du classement serveur d'un membre
     * @param {string} leaderboardName choix du leaderboard
     * @param {string} memberId identifiant Discord du membre
     * @param {Object} playerDatas données du profil ScoreSaber ou BeatLeader du membre
     * @returns {Promise<(MemberRanking|null)>} classement serveur du membre
     */
    updateMemberLeaderboard: async function(leaderboardName, memberId, playerDatas) {
        const leaderboardCount = await Leaderboard.count({
            where: {
                leaderboardName: leaderboardName,
                memberId: memberId
            }
        })

        if(leaderboardCount) {
            const memberLd = await module.exports.getMemberLeaderboard(leaderboardName, memberId)

            await Leaderboard.update({
                playerId: playerDatas.id,
                playerName: playerDatas.name,
                playerCountry: playerDatas.country,
                pp: playerDatas.pp,
                rank: playerDatas.rank,
                countryRank: playerDatas.countryRank,
                averageRankedAccuracy: playerDatas.averageRankedAccuracy,
                serverRankPP: memberLd.serverRankPP,
                serverRankAcc: memberLd.serverRankAcc
            },
            {
                where: {
                    leaderboardName: leaderboardName,
                    memberId: memberId
                }
            })
        }

        return module.exports.getMember(leaderboardName, memberId)
    },

    /**
     * Suppression du classement serveur d'un membre
     * @param {string} memberId identifiant Discord du membre
     */
    delMemberLeaderboard: async function(memberId) {
        await Leaderboard.destroy({
            where: {
                memberId: memberId
            }
        })
    },

    /**
     * Actualise le classement de tous les membres du serveur
     * puis met à jour leurs rôles de pp
     * @param {Collection<GuildMember>} members liste des membres de la guild 
     */
    refreshLeaderboard: async function(members) {
        const ld = await Leaderboard.findAll({
            where: {
                leaderboardName: 'scoresaber'
            }
        })

        for(const lm of ld) {
            Logger.log('Leaderboard', 'INFO', `Actualisation du joueur "${lm.playerName}"...`)

            const playerDatas = await scoresaber.getPlayerDatas(lm.playerId)
            const member = members.find(m => m.id === lm.memberId)

            if(member) {
                const pp = playerDatas.banned ? 0 : playerDatas.pp
                await roles.updateMemberPpRoles(member, pp)

                Logger.log('Leaderboard', 'INFO', `Actualisation du joueur "${lm.playerName}" terminée`)
            } else {
                Logger.log('Leaderboard', 'WARNING', `Le joueur "${lm.playerName}" est introuvable`)
            }
        }
    }
}