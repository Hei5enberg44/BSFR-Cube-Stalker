const { Collection, GuildMember } = require('discord.js')
const { LeaderboardError } = require('../utils/error')
const { countryCodeEmoji } = require('../utils/country-code-emoji')
const Logger = require('../utils/logger')
const scoresaber = require('./scoresaber')
const roles = require('./roles')
const Database = require('./database')

module.exports = {
    /**
     * Récéupration du classement serveur global
     * @param {string} type type de classement (pp ou acc)
     * @param {number} page page à afficher (10 éléments par page)
     * @returns {Promise<{pp: string, acc: string, total: number}>} classement serveur global
     */
     getLeaderboard: async function(type, page) {
        const client = new Database()

        try {
            const db = await client.connect()
            const l = db.collection('leaderboard')

            // Récupération du classement
            const itemsPerPage = 10
            
            const leaderboardCount = await l.countDocuments()

            if(leaderboardCount == 0)
                throw new LeaderboardError('Aucune donnée de classement disponible.')

            const pageCount = Math.ceil(leaderboardCount / itemsPerPage)

            if(page > pageCount)
                throw new LeaderboardError('La page demandée n\'existe pas.')

            const sort = type == 'pp' ? { pp: -1, _id: 1 } : { averageRankedAccuracy: -1, _id: 1 }
            const leaderboard = await l.find().sort(sort).skip((page - 1) * itemsPerPage).limit(itemsPerPage).toArray()

            let playersList = ''
            for(let i = 0; i < leaderboard.length; i++) {
                const ml = leaderboard[i]
                const rank = `#${i + 1}`.replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')
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
        } finally {
            client.close()
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

        const playersList = await module.exports.getGlobalLeaderboardByPlayerRank(rank)

        return playersList
    },

    /**
     * Récéupration du classement serveur d'un membre
     * @param {number} memberId identifiant Discord du membre
     * @returns {Promise<{pp: string, acc: string, total: number}>} classement serveur du membre
     */
    getMemberLeaderboard: async function(memberId) {
        const client = new Database()

        try {
            const db = await client.connect()
            const l = db.collection('leaderboard')

            // Récupération du classement
            const leaderboard = await l.find({}, { pp: 1 }).toArray()

            // Récupération des rangs Discord du membre
            let rankPP = leaderboard.sort((a, b) => b.pp - a.pp).findIndex(leaderboard => leaderboard.memberId == memberId)
            let rankAcc = leaderboard.sort((a, b) => b.averageRankedAccuracy - a.averageRankedAccuracy).findIndex(leaderboard => leaderboard.memberId == memberId)

            if(rankPP === -1 || rankAcc === -1) return null

            // Affichage d'une médaille pour les 3 premières positions du classement
            rankPP = `#${rankPP + 1}`.replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')
            rankAcc = `#${rankAcc + 1}`.replace(/^#1$/, '🥇').replace(/^#2$/, '🥈').replace(/^#3$/, '🥉')

            return {
                pp: rankPP,
                acc: rankAcc,
                total: leaderboard.length
            }
        } finally {
            client.close()
        }
    },

    /**
     * Ajout d'un membre au classement serveur
     * @param {number} memberId identifiant Discord du membre
     * @param {number} scoreSaberDatas identifiant du profil ScoreSaber du membre
     * @returns {Promise<{pp: string, acc: string, total: number}>} classement serveur du membre
     */
    addMemberLeaderboard: async function(memberId, scoreSaberDatas) {
        const client = new Database()

        try {
            const db = await client.connect()
            const l = db.collection('leaderboard')

            const leaderboardCount = await l.findOne({ memberId: memberId })

            if(!leaderboardCount) {
                await l.insertOne({
                    memberId: memberId,
                    scoreSaberId: scoreSaberDatas.id,
                    scoreSaberName: scoreSaberDatas.name,
                    scoreSaberCountry: scoreSaberDatas.country,
                    pp: scoreSaberDatas.pp,
                    averageRankedAccuracy: scoreSaberDatas.averageRankedAccuracy
                })
            }

            return module.exports.getMemberLeaderboard(memberId)
        } finally {
            client.close()
        }
    },

    /**
     * Mise à jour du classement serveur d'un membre
     * @param {number} memberId identifiant Discord du membre
     * @param {number} scoreSaberDatas données du profil ScoreSaber du membre
     * @returns {Promise<{pp: string, acc: string, total: number}>} classement serveur du membre
     */
    updateMemberLeaderboard: async function(memberId, scoreSaberDatas) {
        const client = new Database()

        try {
            const db = await client.connect()
            const l = db.collection('leaderboard')

            const leaderboardCount = await l.countDocuments({ memberId: memberId })

            if(leaderboardCount) {
                await l.updateOne(
                    {
                        memberId: memberId
                    },
                    {
                        $set: {
                            scoreSaberId: scoreSaberDatas.id,
                            scoreSaberName: scoreSaberDatas.name,
                            scoreSaberCountry: scoreSaberDatas.country,
                            pp: scoreSaberDatas.pp,
                            averageRankedAccuracy: scoreSaberDatas.averageRankedAccuracy
                        }
                    }
                )
            }

            return module.exports.getMemberLeaderboard(memberId)
        } finally {
            client.close()
        }
    },

    /**
     * Suppression du classement serveur d'un membre
     * @param {number} memberId identifiant Discord du membre
     */
    delMemberLeaderboard: async function(memberId) {
        const client = new Database()

        try {
            const db = await client.connect()
            const l = db.collection('leaderboard')

            await l.deleteOne({ memberId: memberId })
        } finally {
            client.close()
        }
    },

    /**
     * Actualise le classement de tous les membre du serveur
     * puis met à jour leurs rôles de pp
     * @param {Collection<GuildMember>} members liste des membres de la guild 
     */
     refreshLeaderboard: async function(members) {
        const client = new Database()

        try {
            const db = await client.connect()
            const l = db.collection('leaderboard')

            const ld = await l.find().toArray()

            ld.forEach(async (lm) => {
                Logger.log(`[Leaderboard] Actualisation du joueur "${lm.scoreSaberName}"...`)

                const playerDatas = await scoresaber.getPlayerDatas(lm.scoreSaberId)
                const pp = playerDatas.pp

                const member = members.find(m => m.id === lm.memberId)
                if(member) {
                    await roles.updateMemberPpRoles(member, pp)

                    Logger.log(`[Leaderboard] Actualisation du joueur "${lm.scoreSaberName}" terminée`)
                } else {
                    Logger.log(`[Leaderboard] Le joueur "${lm.scoreSaberName}" est introuvable`)
                }
            })
        } finally {
            client.close()
        }
    }
}