const members = require('./members')
const scoresaber = require('./scoresaber')
const beatsaver = require('./beatsaver')
const { Top1, LastMembersMaps, Members } = require('./database')
const { Top1Error, ScoreSaberError, BeatSaverError } = require('../utils/error')

function calcAcc(mapDetails, levelDifficulty, levelGameMode, score) {
    const notes = mapDetails.versions[0].diffs.filter(diff => diff.difficulty === levelDifficulty && diff.characteristic === levelGameMode)[0].notes
    const maxScore = beatsaver.getMapMaxScore(notes)
    return score / maxScore * 100
}

module.exports = {
    /**
     * Scan pour des nouveaux top 1 FR
     */
    scanTop1FR: async function() {
        try {
            const playersRecentMaps = await module.exports.getPlayersRecentMaps()

            for(const map of playersRecentMaps) {
                const ldFR = await scoresaber.getMapCountryLeaderboard(map.leaderboard.id, 'FR')

                if(ldFR.length > 0) {
                    if(ldFR[0].leaderboardPlayerInfo.id === map.scoreSaberId) {
                        await module.exports.addTop1FR(map.memberId, ldFR, map)
                    }
                }
            }
        } catch(error) {
            if(error instanceof ScoreSaberError) {
                throw new Top1Error('Une erreur est survenue lors du scan des top 1 FR : ' + error.message)
            }
        }
    },

    /**
     * Récupération des dernières maps jouées pour chaque joueur
     * présents dans le classement du serveur
     * @returns {Promise<Array<Object>>} liste des dernières maps jouées pour chaque joueur
     */
    getPlayersRecentMaps: async function() {
        const playersList = await module.exports.getSubscribed()
        const playersMaps = []

        for(const player of playersList) {
            let page = 1
            let foundLastMap = false

            const lastPlayedMap = await module.exports.getPlayerLastPlayedMap(player.scoreSaberId)

            do {
                const maps = await scoresaber.getPlayerRecentMaps(player.scoreSaberId, page)
                for(let i = 0; i < maps.length; i++) {
                    const map = maps[i]
                    if(!lastPlayedMap) {
                        await module.exports.addPlayerLastPlayedMap(player.scoreSaberId, map)
                        foundLastMap = true
                        break
                    } else {
                        if(page === 1 && i === 0)
                            await module.exports.addPlayerLastPlayedMap(player.scoreSaberId, map)
                        
                        if(map.score.timeSet !== lastPlayedMap.timeSet) {
                            map.memberId = player.memberId
                            map.scoreSaberId = player.scoreSaberId
                            playersMaps.push(map)
                        } else {
                            foundLastMap = true
                            break
                        }
                    }
                }
                page++
            } while(!foundLastMap)
        }

        return playersMaps
    },

    /**
     * Récupération de la dernière map jouée par un joueur depuis la base de données
     * @param {string} scoreSaberId identifiant ScoreSaber du joueur
     * @returns {Promise<Object>} dernière map jouée du joueur
     */
    getPlayerLastPlayedMap: async function(scoreSaberId) {
        const lastPlayedMap = await LastMembersMaps.findOne({ where: { scoreSaberId: scoreSaberId } })

        return lastPlayedMap
    },

    /**
     * Ajout de la dernière map jouée par un joueur dans la base de données
     * @param {string} scoreSaberId identifiant ScoreSaber du joueur
     * @param {Object} map dernière map jouée par le joueur
     */
    addPlayerLastPlayedMap: async function(scoreSaberId, map) {
        const lm = await module.exports.getPlayerLastPlayedMap(scoreSaberId)

        if(!lm) {
            await LastMembersMaps.create({
                scoreSaberId: scoreSaberId,
                timeSet: map.score.timeSet
            })
        } else {
            lm.timeSet = map.score.timeSet
            await lm.save()
        }
    },

    /**
     * Ajout d'un top 1 dans la base de données
     * @param {string} memberId identifiant du membre Discord
     * @param {Object} leaderboard première page du classement France de la map
     * @param {Object} map map concernée par le top 1
     */
    addTop1FR: async function(memberId, leaderboard, map) {
        try {
            const mapDetails = await beatsaver.geMapByHash(map.leaderboard.songHash)

            const difficultyRaw = map.leaderboard.difficulty.difficultyRaw
            const levelDifficulty = difficultyRaw.split('_')[1]
            const levelGameMode = difficultyRaw.split('_')[2].replace('Solo', '')

            await Top1.create({
                rank: map.score.rank,
                score: map.score.modifiedScore,
                acc: map.leaderboard.maxScore > 0 ? map.score.modifiedScore / map.leaderboard.maxScore * 100 : calcAcc(mapDetails, levelDifficulty, levelGameMode, map.score.modifiedScore),
                pp: map.score.pp,
                timeSet: map.score.timeSet,
                leaderboardId: map.leaderboard.id,
                songName: map.leaderboard.songName,
                songCoverUrl: map.leaderboard.coverImage,
                levelKey: mapDetails.id,
                levelAuthorName: map.leaderboard.levelAuthorName,
                levelDifficulty: levelDifficulty,
                levelGameMode: levelGameMode,
                scoreSaberId: leaderboard[0].leaderboardPlayerInfo.id,
                scoreSaberName: leaderboard[0].leaderboardPlayerInfo.name,
                beatenScoreSaberId: leaderboard.length > 1 ? leaderboard[1].leaderboardPlayerInfo.id : '',
                beatenScoreSaberName: leaderboard.length > 1 ? leaderboard[1].leaderboardPlayerInfo.name : '',
                memberId: memberId
            })
        } catch(error) {
            if(error instanceof BeatSaverError) {
                throw new Top1Error('Ajout du top 1 impossible : ' + error.message)
            }
        }
    },

    /**
     * Récupère les top 1 FR depuis la base de données
     * @returns {Promise<Object[]>} liste des maps
     */
    getTop1FR: async function() {
        const top1FR = await Top1.findAll()

        return top1FR
    },

    /**
     * Supprime un top 1 FR de la base de données
     * @param {Object} top1Id identifiant du top1 à supprimer
     */
    deleteTop1FR: async function(top1Id) {
        await Top1.destroy({
            where: {
                id: top1Id
            }
        })
    },

    getSubscribed: async function() {
        const subscribed = await Members.findAll({ where: { top1: true } })

        return subscribed
    },

    /**
     * Vérifie si un membre est inscript au top 1 FR
     * @param {string} memberId identifiant du membre Discord
     * @returns {Promise<boolean>}
     */
    isSubscribed: async function(memberId) {
        const member = await members.getMember(memberId)

        return member.top1 !== undefined ? member.top1 : true
    },

    /**
     * Inscrit/Désinscrit un membre au top 1 FR
     * @param {string} memberId identifiant du membre Discord
     * @param {boolean} subscribe
     */
    subscribe: async function(memberId, subscribe) {
        await Members.update({ top1: subscribe }, {
            where: {
                memberId: memberId
            }
        })
    }
}