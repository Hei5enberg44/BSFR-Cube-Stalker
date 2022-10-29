import { WebSocket } from 'ws'
import scoresaber from './scoresaber.js'
import beatsaver from './beatsaver.js'
import roles from './roles.js'
import { userMention, bold, hyperlink, time } from 'discord.js'
import Embed from '../utils/embed.js'
import { Players } from './database.js'
import { Top1Error, ScoreSaberError, BeatSaverError } from '../utils/error.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

const calcAcc = (mapDetails, levelDifficulty, levelGameMode, score) => {
    const notes = mapDetails.versions[0].diffs.filter(diff => diff.difficulty === levelDifficulty && diff.characteristic === levelGameMode)[0].notes
    const maxScore = beatsaver.getMapMaxScore(notes)
    return score / maxScore * 100
}

export default {
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
     * @property {string} scoreSaberCountry
     * @property {string} beatenScoreSaberId
     * @property {string} beatenScoreSaberName
     * @property {string|null} replay
     * @property {string} memberId
     */

    /**
     * Scan pour des nouveaux top 1 pays
     * @param {Client} client client Discord
     */
    listen(client) {
        const self = this

        Logger.log('Top1', 'INFO', 'Écoute des tops 1 pays sur le websocket de ScoreSaber')

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

                    const player = await Players.findOne({
                        where: {
                            leaderboard: 'scoresaber',
                            playerId: playerId,
                            playerCountry: country,
                            top1: true
                        }
                    })

                    if(player) {
                        try {
                            const mapLd = await scoresaber.getMapCountryLeaderboard(leaderboard.id, country)

                            if(mapLd[0].leaderboardPlayerInfo.id === playerId) {
                                Logger.log('Top1', 'INFO', `Nouveau top 1 pays de « ${playerName} » sur « ${leaderboard.songName} »`)

                                const mapDetails = await beatsaver.getMapByHash(leaderboard.songHash)
                    
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
                                    scoreSaberId: mapLd[0].leaderboardPlayerInfo.id,
                                    scoreSaberName: mapLd[0].leaderboardPlayerInfo.name,
                                    scoreSaberCountry: mapLd[0].leaderboardPlayerInfo.country,
                                    beatenScoreSaberId: mapLd.length > 1 ? mapLd[1].leaderboardPlayerInfo.id : '',
                                    beatenScoreSaberName: mapLd.length > 1 ? mapLd[1].leaderboardPlayerInfo.name : '',
                                    replay: score.hasReplay ? `https://www.replay.beatleader.xyz/?id=${mapDetails.id}&difficulty=${levelDifficulty}&playerID=${playerId}` : null,
                                    memberId: player.memberId
                                }

                                await self.publish(client, top1)
                            }
                        } catch(error) {
                            if(error instanceof BeatSaverError || error instanceof ScoreSaberError) {
                                throw new Top1Error(`Ajout du top 1 pays impossible (${error.message})`)
                            }
                        }
                    }
                }
            } catch(error) {
                if(error instanceof Top1Error) {
                    Logger.log('Top1', 'ERROR', error.message)
                }
            }
        })

        ws.on('close', () => {
            Logger.log('Top1', 'WARNING', 'Le websocket de ScoreSaber s\'est fermé')
            setTimeout(function() {
                self.listen(client)
            }, 60 * 1000)
        })
    },

    /**
     * Publication d'un top 1 pays dans le channel #top-1-pays
     * @param {Client} client client Discord
     * @param {Top1} top1 données du top 1 pays
     */
    async publish(client, top1) {
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
                { name: 'Pays', value: `${countryCodeEmoji(top1.scoreSaberCountry)}`, inline: true },
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

        const top1paysChannel = guild.channels.cache.find(c => c.id === config.guild.channels.top1pays)
        await top1paysChannel.send({ embeds: [embed] })
    },

    /**
     * Récupère la liste des joueurs inscrits au top 1 pays
     * @returns {Promise<Array<{memberId: string, playerId: string, top1: boolean}>>}
     */
    async getSubscribed() {
        const subscribed = await Players.findAll({
            where: {
                top1: true,
                leaderboard: 'scoresaber'
            }
        })
        return subscribed
    },

    /**
     * Inscrit/Désinscrit un membre au top 1 pays
     * @param {string} memberId identifiant Discord du membre
     * @param {boolean} subscribe
     */
    async subscribe(memberId, subscribe) {
        await Players.update({ top1: subscribe }, {
            where: {
                memberId: memberId,
                leaderboard: 'scoresaber'
            }
        })
    }
}