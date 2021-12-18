const { Collection, GuildMember } = require('discord.js')
const { LeaderboardError } = require('../utils/error')
const { countryCodeEmoji } = require('../utils/country-code-emoji')
const Logger = require('../utils/logger')
const scoresaber = require('./scoresaber')
const roles = require('./roles')
const { Leaderboard } = require('./database')

module.exports = {
    /**
     * Récéupration du classement serveur global
     * @param {string} type type de classement (pp ou acc)
     * @param {number} page page à afficher (10 éléments par page)
     * @returns {Promise<Object>} classement serveur global
     */
     getLeaderboard: async function(type, page) {
        // Récupération du classement
        const itemsPerPage = 10
        
        const leaderboardCount = await Leaderboard.count()

        if(leaderboardCount == 0)
            throw new LeaderboardError('Aucune donnée de classement disponible.')

        const pageCount = Math.ceil(leaderboardCount / itemsPerPage)

        if(page > pageCount)
            throw new LeaderboardError('La page demandée n\'existe pas.')

        const sort = type == 'pp' ? [[ 'pp', 'DESC' ], [ 'id', 'ASC' ]] : [[ 'averageRankedAccuracy', 'DESC' ], [ 'id', 'ASC' ]]
        const leaderboard = await Leaderboard.findAll({
            order: sort,
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        let playersList = ''
        for(let i = 0; i < leaderboard.length; i++) {
            const ml = leaderboard[i]
            const pos = (page - 1) * itemsPerPage + i + 1
            const rank = `#${pos}`.replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')
            const pp = new Intl.NumberFormat('en-US').format(ml.pp) + 'pp'
            const acc = (ml.averageRankedAccuracy).toFixed(2) + '%'
            const stat = type == 'pp' ? pp : acc
            const scoreSaberUrl = `https://scoresaber.com/u/${ml.scoreSaberId}`
            playersList += `${rank} - ${ml.scoreSaberCountry !== '' ? countryCodeEmoji(ml.scoreSaberCountry) : '🏴‍☠️'} [${ml.scoreSaberName}](${scoreSaberUrl}) - ${stat}\n`
        }

        const pageInfo = `Page \`${page}\` sur \`${pageCount}\``

        return {
            title: 'Classement ' + (type == 'pp' ? 'PP' : 'Précision') + ` Serveur (${leaderboardCount} joueurs)`,
            content: playersList + '\n' + pageInfo
        }
    },

    /**
     * Récupération du classement global
     * @param {number} count nombre de joueurs à récupérer
     * @returns {Promise<string>} liste des meilleurs joueurs au classement mondial
     */
    getGlobalLeaderboard: async function(count) {
        const ld = await scoresaber.getGlobal(1)
        
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
     * @param {number} rank rang du joueur
     * @returns {Promise<string>} liste des joueurs
     */
    getGlobalLeaderboardByPlayerRank: async function(rank) {
        const playersPerPage = 50
        const page = Math.ceil(rank / 50)
        let pos = rank % playersPerPage === 1 ? 0 : (rank % playersPerPage === 0 ? playersPerPage - 1 : rank % playersPerPage - 1)

        let ld = await scoresaber.getGlobal(page)

        let start = pos - 5 >= 0 ? pos - 5 : pos
        if(pos - 5 < 0 && page > 1) {
            let _ld = await scoresaber.getGlobal(page - 1)
            ld = _ld.concat(ld)
            pos += playersPerPage
            start = pos - 5
        }
        if(pos + 5 > ld.length - 1) {
            let _ld = await scoresaber.getGlobal(page + 1)
            if(_ld.length > 0) {
                ld = ld.concat(_ld)
            } else {
                start = pos + (ld.length - pos - 11)
                if(start < 0) {
                    _ld = await scoresaber.getGlobal(page - 1)
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
     * @param {string} scoreSaberId identifiant ScoreSaber du joueur
     * @returns {Promise<string>} liste des joueurs
     */
     getGlobalLeaderboardByPlayerId: async function(scoreSaberId) {
        const rank = await scoresaber.getPlayerRankById(scoreSaberId)

        return module.exports.getGlobalLeaderboardByPlayerRank(rank)
    },

    /**
     * Récupération du classement serveur d'un membre
     * @param {string} memberId identifiant Discord du membre
     * @returns {Promise<Object>} classement serveur du membre
     */
     getMemberLeaderboard: async function(memberId) {
        // Récupération du classement
        const leaderboard = await Leaderboard.findAll({
            order: [
                [ 'pp', 'ASC' ]
            ]
        })

        // Récupération des rangs Discord du membre
        let serverRankPP = leaderboard.sort((a, b) => b.pp - a.pp).findIndex(ld => ld.memberId == memberId)
        let serverRankAcc = leaderboard.sort((a, b) => b.averageRankedAccuracy - a.averageRankedAccuracy).findIndex(ld => ld.memberId == memberId)

        if(serverRankPP === -1 || serverRankAcc === -1) return null

        return {
            serverRankPP: serverRankPP + 1,
            serverRankAcc: serverRankAcc + 1,
            serverLdTotal: leaderboard.length
        }
    },

    /**
     * Récupération des données de classement d'un membre
     * @param {string} memberId identifiant Discord du membre
     * @returns {Promise<Object>} classement serveur du membre
     */
    getMember: async function(memberId) {
        // Récupération du classement
        const leaderboard = await Leaderboard.findAll({
            order: [
                [ 'pp', 'ASC' ]
            ]
        })

        // Récupération des données de classement du joueur
        const ldDatas = leaderboard.find(ld => ld.memberId == memberId)

        if(!ldDatas) return null

        return {
            pp: ldDatas.pp,
            rank: ldDatas.rank,
            countryRank: ldDatas.countryRank,
            averageRankedAccuracy: ldDatas.averageRankedAccuracy,
            serverRankPP: ldDatas.serverRankPP,
            serverRankAcc: ldDatas.serverRankAcc,
            serverLdTotal: leaderboard.length
        }
    },

    /**
     * Ajout d'un membre au classement serveur
     * @param {string} memberId identifiant Discord du membre
     * @param {Object} scoreSaberDatas données du profil ScoreSaber du membre
     * @returns {Promise<Object>} classement serveur du membre
     */
    addMemberLeaderboard: async function(memberId, scoreSaberDatas) {
        const leaderboardCount = await Leaderboard.findOne({ where: { memberId: memberId } })

        if(!leaderboardCount) {
            await Leaderboard.create({
                memberId: memberId,
                scoreSaberId: scoreSaberDatas.id,
                scoreSaberName: scoreSaberDatas.name,
                scoreSaberCountry: scoreSaberDatas.country,
                pp: scoreSaberDatas.pp,
                rank: scoreSaberDatas.rank,
                countryRank: scoreSaberDatas.countryRank,
                averageRankedAccuracy: scoreSaberDatas.averageRankedAccuracy,
                serverRankAcc: 0,
                serverRankPP: 0
            })

            const memberLd = await module.exports.getMemberLeaderboard(memberId)

            await Leaderboard.update({
                serverRankPP: memberLd.serverRankPP,
                serverRankAcc: memberLd.serverRankAcc
            }, {
                where: {
                    memberId: memberId
                }
            })
        }

        return module.exports.getMember(memberId)
    },

    /**
     * Mise à jour du classement serveur d'un membre
     * @param {string} memberId identifiant Discord du membre
     * @param {Object} scoreSaberDatas données du profil ScoreSaber du membre
     * @returns {Promise<Object>} classement serveur du membre
     */
    updateMemberLeaderboard: async function(memberId, scoreSaberDatas) {
        const leaderboardCount = await Leaderboard.count({ where: { memberId: memberId } })

        if(leaderboardCount) {
            const memberLd = await module.exports.getMemberLeaderboard(memberId)

            await Leaderboard.update({
                scoreSaberId: scoreSaberDatas.id,
                scoreSaberName: scoreSaberDatas.name,
                scoreSaberCountry: scoreSaberDatas.country,
                pp: scoreSaberDatas.pp,
                rank: scoreSaberDatas.rank,
                countryRank: scoreSaberDatas.countryRank,
                averageRankedAccuracy: scoreSaberDatas.averageRankedAccuracy,
                serverRankPP: memberLd.serverRankPP,
                serverRankAcc: memberLd.serverRankAcc
            },
            {
                where: {
                    memberId: memberId
                }
            })
        }

        return module.exports.getMember(memberId)
    },

    /**
     * Suppression du classement serveur d'un membre
     * @param {string} memberId identifiant Discord du membre
     */
    delMemberLeaderboard: async function(memberId) {
        await Leaderboard.destroy({
            where: { memberId: memberId }
        })
    },

    /**
     * Actualise le classement de tous les membre du serveur
     * puis met à jour leurs rôles de pp
     * @param {Collection<GuildMember>} members liste des membres de la guild 
     */
     refreshLeaderboard: async function(members) {
        const ld = await Leaderboard.findAll()

        ld.forEach(async (lm) => {
            Logger.log('Leaderboard', 'INFO', `Actualisation du joueur "${lm.scoreSaberName}"...`)

            const playerDatas = await scoresaber.getPlayerDatas(lm.scoreSaberId)
            const pp = playerDatas.pp

            const member = members.find(m => m.id === lm.memberId)
            if(member) {
                await roles.updateMemberPpRoles(member, pp)

                Logger.log('Leaderboard', 'INFO', `Actualisation du joueur "${lm.scoreSaberName}" terminée`)
            } else {
                Logger.log('Leaderboard', 'WARNING', `Le joueur "${lm.scoreSaberName}" est introuvable`)
            }
        })
    }
}