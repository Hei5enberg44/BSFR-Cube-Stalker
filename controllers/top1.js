const { WebSocket } = require('ws')
const scoresaber = require('./scoresaber')
const beatsaver = require('./beatsaver')
const roles = require('./roles')
const { userMention, bold, hyperlink, time } = require('discord.js')
const Embed = require('../utils/embed')
const { Players } = require('./database')
const { Top1Error, ScoreSaberError, BeatSaverError } = require('../utils/error')
const config = require('../config.json')
const Logger = require('../utils/logger')

function calcAcc(mapDetails, levelDifficulty, levelGameMode, score) {
    const notes = mapDetails.versions[0].diffs.filter(diff => diff.difficulty === levelDifficulty && diff.characteristic === levelGameMode)[0].notes
    const maxScore = beatsaver.getMapMaxScore(notes)
    return score / maxScore * 100
}

module.exports = {
    /**
     * @typedef {Object} Top1
     * @property {number} rank
     * @property {number} score
     * @property {number} acc
     * @property {number} pp
     * @property {string} timeSet
     * @property {number} leaderboardId
     * @property {string} songName
     * @property {string} songCoverUrl
     * @property {string} levelKey
     * @property {string} levelAuthorName
     * @property {string} levelDifficulty
     * @property {string} levelGameMode
     * @property {boolean} ranked
     * @property {string} scoreSaberId
     * @property {string} scoreSaberName
     * @property {string} beatenScoreSaberId
     * @property {string} beatenScoreSaberName
     * @property {string|null} replay
     * @property {string} memberId
     */

    /**
     * Scan pour des nouveaux top 1 FR
     * @param {Client} client client Discord
     */
    listen: function(client) {
        Logger.log('Top1FR', 'INFO', 'Écoute des tops 1 FR sur le websocket de ScoreSaber')

        const ws = new WebSocket('wss://scoresaber.com/ws')

        ws.on('message', async (data) => {
            const message = data.toString()

            try {
                const command = JSON.parse(message)

                if(command?.commandName === 'score') {
                    const score = command?.commandData?.score
                    const leaderboard = command?.commandData?.leaderboard
                    const playerId = score?.leaderboardPlayerInfo?.id
                    const playerName = score?.leaderboardPlayerInfo?.name
                    const country = score?.leaderboardPlayerInfo?.country

                    if(country === 'FR') {
                        const player = await Players.findOne({
                            where: {
                                playerId : playerId,
                                leaderboard: 'scoresaber',
                                top1: true
                            }
                        })

                        if(player) {
                            try {
                                const ldFR = await scoresaber.getMapCountryLeaderboard(leaderboard.id, 'FR')

                                if(ldFR[0].leaderboardPlayerInfo.id === playerId) {
                                    Logger.log('Top1FR', 'INFO', `Nouveau top 1 FR de « ${playerName} » sur « ${leaderboard.songName} »`)

                                    const mapDetails = await beatsaver.geMapByHash(leaderboard.songHash)
                        
                                    const levelDifficulty = leaderboard.difficulty.difficultyRaw.split('_')[1]
                                    const levelGameMode = leaderboard.difficulty.gameMode.replace('Solo', '')
                        
                                    const top1 = {
                                        rank: score.rank,
                                        score: score.modifiedScore,
                                        acc: leaderboard.maxScore > 0 ? score.modifiedScore / leaderboard.maxScore * 100 : calcAcc(mapDetails, levelDifficulty, levelGameMode, score.modifiedScore),
                                        pp: score.pp,
                                        timeSet: score.timeSet,
                                        leaderboardId: leaderboard.id,
                                        songName: leaderboard.songName,
                                        songCoverUrl: leaderboard.coverImage,
                                        levelKey: mapDetails.id,
                                        levelAuthorName: leaderboard.levelAuthorName,
                                        levelDifficulty: levelDifficulty,
                                        levelGameMode: levelGameMode,
                                        ranked: leaderboard.ranked,
                                        scoreSaberId: ldFR[0].leaderboardPlayerInfo.id,
                                        scoreSaberName: ldFR[0].leaderboardPlayerInfo.name,
                                        beatenScoreSaberId: ldFR.length > 1 ? ldFR[1].leaderboardPlayerInfo.id : '',
                                        beatenScoreSaberName: ldFR.length > 1 ? ldFR[1].leaderboardPlayerInfo.name : '',
                                        replay: score.hasReplay ? `https://www.replay.beatleader.xyz/?id=${mapDetails.id}&difficulty=${levelDifficulty}&playerID=${playerId}` : null,
                                        memberId: player.memberId
                                    }

                                    await module.exports.publish(client, top1)
                                }
                            } catch(error) {
                                if(error instanceof BeatSaverError || error instanceof ScoreSaberError) {
                                    throw new Top1Error(`Ajout du top 1 impossible (${error.message})`)
                                }
                            }
                        }
                    }
                }
            } catch(error) {
                if(error instanceof Top1Error) {
                    Logger.log('Top1FR', 'ERROR', error.message)
                }
            }
        })

        ws.on('close', () => {
            Logger.log('Top1FR', 'WARNING', 'Le websocket de ScoreSaber s\'est fermé')
            setTimeout(function() {
                module.exports.listen(client)
            }, 60 * 1000)
        })
    },

    /**
     * Publication d'un top 1 FR dans le channel #top-1-fr
     * @param {Client} client client Discord
     * @param {Top1} top1 données du top 1 FR
     */
    publish: async function(client, top1) {
        const guild = client.guilds.cache.find(g => g.id === config.guild.id)
        await guild.members.fetch()

        const member = guild.members.cache.find(m => m.id === top1.memberId)
        const color = member ? roles.getMemberPpRoleColor(member) : null

        const rankedIconName = 'ss'
        const rankedIcon = guild.emojis.cache.find(e => e.name === rankedIconName)
        const rankedIconId = rankedIcon?.id

        const embed = new Embed()
            .setColor(color ?? '#F1C40F')
            .setTitle(top1.songName)
            .setURL(`https://scoresaber.com/leaderboard/${top1.leaderboardId}`)
            .setThumbnail(top1.songCoverUrl)
            .setDescription(`${(top1.ranked && rankedIcon) ? `<:${rankedIconName}:${rankedIconId}> ` : ''}${bold(`${top1.levelDifficulty.replace('ExpertPlus', 'Expert+')} (${top1.levelGameMode})`)} par ${bold(top1.levelAuthorName)}\n${bold('Date')} : ${time(new Date(top1.timeSet))}`)
            .addFields(
                { name: 'Joueur', value: `${userMention(top1.memberId)}`, inline: true },
                { name: 'ScoreSaber', value: hyperlink(top1.scoreSaberName, `https://scoresaber.com/u/${top1.scoreSaberId}`), inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'Score', value: `${new Intl.NumberFormat('en-US').format(top1.score)}`, inline: true },
                { name: 'Précision', value: `${(top1.acc).toFixed(2)}%`, inline: true },
                { name: 'Rang 🌍', value: `#${top1.rank}`, inline: true },
                { name: 'BeatSaver', value: hyperlink('Lien', `https://beatsaver.com/maps/${top1.levelKey}`), inline: true },
                { name: 'BSR', value: `!bsr ${top1.levelKey}`, inline: true },
                (top1.replay ? { name: 'Replay', value: hyperlink('Lien', top1.replay), inline: true } : { name: '\u200b', value: '\u200b', inline: true })
            )

        if(top1.beatenScoreSaberId !== '') embed.addFields({ name: 'Bien joué !', value: `Tu es passé(e) devant ${hyperlink(top1.beatenScoreSaberName, `https://scoresaber.com/u/${top1.beatenScoreSaberId}`)}` })

        const top1FRChannel = guild.channels.cache.find(c => c.id === config.guild.channels.top1fr)
        await top1FRChannel.send({ embeds: [embed] })
    },

    /**
     * Récupère la liste des joueurs inscrits au top 1 FR
     * @returns {Promise<Array<{memberId: string, playerId: string, top1: boolean}>>}
     */
    getSubscribed: async function() {
        const subscribed = await Players.findAll({
            where: {
                top1: true,
                leaderboard: 'scoresaber'
            }
        })
        return subscribed
    },

    /**
     * Inscrit/Désinscrit un membre au top 1 FR
     * @param {string} memberId identifiant Discord du membre
     * @param {boolean} subscribe
     */
    subscribe: async function(memberId, subscribe) {
        await Players.update({ top1: subscribe }, {
            where: {
                memberId: memberId,
                leaderboard: 'scoresaber'
            }
        })
    }
}