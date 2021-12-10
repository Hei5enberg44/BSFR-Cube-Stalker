const { Top1Error } = require('../utils/error')
const members = require('./members')
const scoresaber = require('./scoresaber')
const beatsaver = require('./beatsaver')
const Database = require('./database')

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
        const playersRecentMaps = await module.exports.getPlayersRecentMaps()

        for(const map of playersRecentMaps) {
            const top1FR = await scoresaber.getMapCountryLeaderboardTop1Player(map.leaderboard.id, 'FR')
            if(top1FR.leaderboardPlayerInfo.id === map.scoreSaberId) {
                await module.exports.addTop1FR(map.memberId, top1FR.leaderboardPlayerInfo, map)
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
        const client = new Database()

        try {
            const db = await client.connect()
            const lm = db.collection('lastMembersMaps')

            const lastPlayedMap = await lm.findOne({
                scoreSaberId: scoreSaberId
            })

            return lastPlayedMap
        } finally {
            client.close()
        }
    },

    /**
     * Ajout de la dernière map jouée par un joueur dans la base de données
     * @param {string} scoreSaberId identifiant ScoreSaber du joueur
     * @param {Object} map dernière map jouée par le joueur
     */
     addPlayerLastPlayedMap: async function(scoreSaberId, map) {
        const client = new Database()

        try {
            const db = await client.connect()
            const lm = db.collection('lastMembersMaps')

            await lm.updateOne(
                {
                    scoreSaberId: scoreSaberId
                }, {
                    $set: {
                        timeSet: map.score.timeSet
                    }
                }, {
                    upsert: true
            })
        } finally {
            client.close()
        }
    },

    /**
     * Ajout d'un top 1 dans la base de données
     * @param {string} memberId identifiant du membre Discord
     * @param {Object} playerInfos informations concernant le joueur
     * @param {Object} map map concernée par le top 1
     */
    addTop1FR: async function(memberId, playerInfos, map) {
        const client = new Database()

        const mapDetails = await beatsaver.geMapByHash(map.leaderboard.songHash)

        try {
            const db = await client.connect()
            const t = db.collection('top1')

            const difficultyRaw = map.leaderboard.difficulty.difficultyRaw
            const levelDifficulty = difficultyRaw.split('_')[1]
            const levelGameMode = difficultyRaw.split('_')[2].replace('Solo', '')

            await t.insertOne({
                score: map.score.modifiedScore,
                acc: map.leaderboard.maxScore > 0 ? map.score.modifiedScore / map.leaderboard.maxScore * 100 : calcAcc(mapDetails, levelDifficulty, levelGameMode, map.score.modifiedScore),
                pp: map.score.pp,
                timeSet: map.score.timeSet,
                leaderboardId: map.leaderboard.id,
                songName: map.leaderboard.songName,
                songCoverUrl: map.leaderboard.coverImage,
                levelKey: mapDetails.id,
                levelAuthorName: map.leaderboard.songAuthorName,
                levelDifficulty: levelDifficulty,
                levelGameMode: levelGameMode,
                scoreSaberId: playerInfos.id,
                scoreSaberName: playerInfos.name,
                memberId: memberId
            })
        } finally {
            client.close()
        }
    },

    /**
     * Récupère les top 1 FR depuis la base de données
     * @returns {Promise<Object[]>} liste des maps
     */
     getTop1FR: async function() {
        const client = new Database()

        try {
            const db = await client.connect()
            const t = db.collection('top1')

            const top1FR = await t.find().toArray()

            return top1FR
        } finally {
            client.close()
        }
    },

    /**
     * Supprime un top 1 FR de la base de données
     * @param {Object} top1 données du top 1 à supprimer
     */
    deleteTop1FR: async function(top1) {
        const client = new Database()

        try {
            const db = await client.connect()
            const t = db.collection('top1')

            await t.deleteOne({
                scoreSaberId: top1.scoreSaberId,
                memberId: top1.memberId,
                leaderboardId: top1.leaderboardId,
                score: top1.score,
                pp: top1.pp
            })
        } finally {
            client.close()
        }
    },

    getSubscribed: async function() {
        const client = new Database()

        try {
            const db = await client.connect()
            const m = db.collection('members')

            const subscribed = await m.find({
                top1: true
            }).toArray()

            return subscribed
        } finally {
            client.close()
        }
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
        const client = new Database()

        try {
            const db = await client.connect()
            const m = db.collection('members')

            await m.updateOne(
                {
                    memberId: memberId,
                },
                {
                    $set: {
                        top1: subscribe
                    }
                },
                { upsert: true }
            )
        } finally {
            client.close()
        }
    }
}