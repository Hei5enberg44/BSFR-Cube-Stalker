const leaderboard = require('./leaderboard')
const { PlayerError } = require('../utils/error')
const { Players, Leaderboard } = require('./database')

module.exports = {
    /**
     * @typedef {Object} Player
     * @property {string} leaderboard
     * @property {string} memberId
     * @property {string} playerId
     * @property {string} playerName
     * @property {string} playerCountry
     * @property {number} pp
     * @property {number} rank
     * @property {number} countryRank
     * @property {number} averageRankedAccuracy
     * @property {number} serverRankAcc
     * @property {number} serverRankPP
     * @property {boolean} top1
     */

    /**
     * Récupère un joueur depuis la table « players »
     * @param {string} memberId identifiant Discord du membre
     * @param {string} leaderboardName nom du leaderboard
     * @returns {Promise<Player>} informations du joueur
     */
    get: async function(memberId, leaderboardName) {
        return await Players.findOne({
            where: {
                memberId: memberId,
                leaderboard: leaderboardName
            }
        })
    },

    /**
     * Ajoute un joueur dans la table « players »
     * @param {string} memberId identifiant Discord du membre
     * @param {string} playerId identifiant du profil leaderboard du membre
     * @param {string} leaderboardName nom du leaderboard
     * @param {boolean} isAdmin indique si il s'agit d'un admin/modérateur qui a exécuté la commande
     */
    add: async function(memberId, playerId, leaderboardName, isAdmin = false) {
        if(!isAdmin) {
            // On vérifie si le membre Discord à déjà un profil ScoreSaber ou BeatLeader lié
            const profileIsAlreadyLinked = await Players.count({
                where: {
                    memberId: memberId,
                    leaderboard: leaderboardName
                }
            })
            if(profileIsAlreadyLinked > 0) throw new PlayerError(`Ce compte Discord est déjà lié à un profil ${leaderboardName === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'}\nVeuillez utiliser la commande \`/unlink\` avant de lier un autre profil\n(Cette commande peut être utilisée dans la limite de 1 par mois)`)
        }

        // On vérifie si le profil ScoreSaber ou BeatLeader est déjà lié à un membre Discord
        const playerIsAlreadyLinked = await Players.count({
            where: {
                playerId: playerId,
                leaderboard: leaderboardName
            }
        })
        if(playerIsAlreadyLinked > 0) throw new PlayerError(`Ce profil ${leaderboardName === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'} est déjà relié à un compte Discord`)

        await leaderboard.removePlayerLeaderboard(playerId, leaderboardName)

        const player = await Players.findOne({
            where: {
                playerId: playerId,
                leaderboard: leaderboardName
            }
        })

        if(!player) {
            Players.create({
                leaderboard: leaderboardName,
                memberId: memberId,
                playerId: playerId,
                top1: leaderboardName === 'scoresaber'
            })
        } else {
            player.playerId = playerId
            player.playerName = null
            player.playerCountry = null
            player.pp = null
            player.rank = null
            player.countryRank = null
            player.averageRankedAccuracy = null
            player.serverRankAcc = null
            player.serverRankPP = null
            await player.save()
        }
    },

    /**
     * Données de joueur ScoreSaber
     * @typedef {Object} ScoreSaberPlayerDatas
     * @property {string} id
     * @property {string} name
     * @property {string} avatar
     * @property {string} url
     * @property {number} rank
     * @property {number} countryRank
     * @property {number} pp
     * @property {string} country
     * @property {string} history
     * @property {boolean} banned
     * @property {number} averageRankedAccuracy
     * @property {TopPP} topPP
     */

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
     * Mise à jour d'un joueur
     * @param {string} memberId identifiant Discord du membre
     * @param {string} leaderboardName nom du leaderboard
     * @param {ScoreSaberPlayerDatas} playerDatas données du profil ScoreSaber ou BeatLeader du joueur
     * @param {PlayerRanking} playerRanking données de classement serveur du joueur
     * @returns {Promise<Player>} informations du joueur
     */
    update: async function(memberId, leaderboardName, playerDatas, playerRanking) {
        const player = await Players.findOne({
            where: {
                memberId: memberId,
                leaderboard: leaderboardName
            }
        })

        if(player) {
            await Players.update({
                playerId: playerDatas.id,
                playerName: playerDatas.name,
                playerCountry: playerDatas.country,
                pp: playerDatas.pp,
                rank: playerDatas.rank,
                countryRank: playerDatas.countryRank,
                averageRankedAccuracy: playerDatas.averageRankedAccuracy,
                serverRankPP: playerRanking.serverRankPP,
                serverRankAcc: playerRanking.serverRankAcc
            }, {
                where: {
                    memberId: memberId,
                    leaderboard: leaderboardName
                }
            })
        }

        return module.exports.get(memberId, leaderboardName)
    },

    /**
     * Suppression des données d'un joueur
     * @param {string} memberId identifiant Discord du membre
     */
    remove: async function(memberId) {
        await Players.destroy({ where: { memberId: memberId } })
        await Leaderboard.destroy({ where: { memberId: memberId } })
    }
}