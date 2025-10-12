import { WebSocket } from 'ws'
import {
    Client,
    Guild,
    TextChannel,
    userMention,
    bold,
    hyperlink,
    time
} from 'discord.js'
import { Leaderboards } from './gameLeaderboard.js'
import scoresaber from './scoresaber.js'
import beatsaver from './beatsaver.js'
import { MapDetail } from '../api/beatsaver.js'
import roles from './roles.js'
import Embed from '../utils/embed.js'
import { PlayerModel } from '../models/player.model.js'
import { Top1Data } from '../interfaces/player.interface.js'
import { Top1Error, ScoreSaberError, BeatSaverError } from '../utils/error.js'
import { countryCodeEmoji } from '../utils/country-code-emoji.js'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

const calcAcc = (
    mapDetail: MapDetail,
    levelDifficulty: string,
    levelGameMode: string,
    score: number
) => {
    const notes = mapDetail.versions[
        mapDetail.versions.length - 1
    ].diffs.filter(
        (diff) =>
            diff.difficulty === levelDifficulty &&
            diff.characteristic === levelGameMode
    )[0].notes
    const maxScore = beatsaver.getMapMaxScore(notes)
    return (score / maxScore) * 100
}

export default class Top1 {
    /**
     * Scan pour des nouveaux top 1 pays
     * @param client client Discord
     */
    static listen(client: Client) {
        const self = this

        Logger.log(
            'Top1',
            'INFO',
            'Écoute des tops 1 pays sur le websocket de ScoreSaber'
        )

        const ws = new WebSocket('wss://scoresaber.com/ws')

        ws.on('message', async (data) => {
            const message = data.toString()

            try {
                const command = JSON.parse(message)

                if (command?.commandName === 'score') {
                    const score = command?.commandData?.score
                    const leaderboard = command?.commandData?.leaderboard
                    const playerId = score?.leaderboardPlayerInfo?.id
                    const playerName = score?.leaderboardPlayerInfo?.name
                    const country = score?.leaderboardPlayerInfo?.country

                    const player = await PlayerModel.findOne({
                        where: {
                            leaderboard: 'scoresaber',
                            playerId: playerId,
                            playerCountry: country,
                            top1: true
                        }
                    })

                    if (player) {
                        try {
                            const mapLd =
                                await scoresaber.getMapCountryLeaderboard(
                                    leaderboard.id,
                                    country
                                )

                            if (
                                mapLd[0].leaderboardPlayerInfo &&
                                mapLd[0].leaderboardPlayerInfo.id === playerId
                            ) {
                                Logger.log(
                                    'Top1',
                                    'INFO',
                                    `Nouveau top 1 pays de « ${playerName} » sur « ${leaderboard.songName} »`
                                )

                                const mapDetail = await beatsaver.getMapByHash(
                                    leaderboard.songHash
                                )

                                const levelDifficulty =
                                    leaderboard.difficulty.difficultyRaw.split(
                                        '_'
                                    )[1]
                                const levelGameMode =
                                    leaderboard.difficulty.gameMode.replace(
                                        'Solo',
                                        ''
                                    )

                                const top1 = {
                                    rank: score.rank,
                                    score: score.modifiedScore,
                                    acc:
                                        leaderboard.maxScore > 0
                                            ? (score.modifiedScore /
                                                  leaderboard.maxScore) *
                                              100
                                            : calcAcc(
                                                  mapDetail,
                                                  levelDifficulty,
                                                  levelGameMode,
                                                  score.modifiedScore
                                              ),
                                    pp: score.pp,
                                    timeSet: score.timeSet,
                                    leaderboardId: leaderboard.id,
                                    songName: leaderboard.songName,
                                    songCoverUrl: leaderboard.coverImage,
                                    levelKey: mapDetail.id,
                                    levelAuthorName:
                                        leaderboard.levelAuthorName,
                                    levelDifficulty: levelDifficulty,
                                    levelGameMode: levelGameMode,
                                    ranked: leaderboard.ranked,
                                    scoreSaberId:
                                        mapLd[0].leaderboardPlayerInfo.id,
                                    scoreSaberName:
                                        mapLd[0].leaderboardPlayerInfo.name,
                                    scoreSaberCountry:
                                        mapLd[0].leaderboardPlayerInfo.country,
                                    beatenScoreSaberId:
                                        mapLd.length > 1 &&
                                        mapLd[1].leaderboardPlayerInfo
                                            ? mapLd[1].leaderboardPlayerInfo.id
                                            : '',
                                    beatenScoreSaberName:
                                        mapLd.length > 1 &&
                                        mapLd[1].leaderboardPlayerInfo
                                            ? mapLd[1].leaderboardPlayerInfo
                                                  .name
                                            : '',
                                    replay: null,
                                    memberId: player.memberId
                                }

                                await self.publish(client, top1)
                            }
                        } catch (error) {
                            if (
                                error instanceof BeatSaverError ||
                                error instanceof ScoreSaberError
                            ) {
                                throw new Top1Error(
                                    `Ajout du top 1 pays impossible (${error.message})`
                                )
                            }
                        }
                    }
                }
            } catch (error) {
                if (error instanceof Top1Error) {
                    Logger.log('Top1', 'ERROR', error.message)
                }
            }
        })

        ws.on('close', () => {
            Logger.log(
                'Top1',
                'WARNING',
                "Le websocket de ScoreSaber s'est fermé"
            )
            setTimeout(function () {
                self.listen(client)
            }, 60 * 1000)
        })
    }

    /**
     * Publication d'un top 1 pays dans le channel #top-1-pays
     * @param client client Discord
     * @param top1 données du top 1 pays
     */
    static async publish(client: Client, top1: Top1Data) {
        const guild = client.guilds.cache.find(
            (g) => g.id === config.guild.id
        ) as Guild
        await guild.members.fetch()

        const member = guild.members.cache.find((m) => m.id === top1.memberId)
        const color = member
            ? roles.getMemberPpRoleColor(Leaderboards.ScoreSaber, member)
            : null

        const rankedIconName = 'ss'
        const rankedIcon = guild.emojis.cache.find(
            (e) => e.name === rankedIconName
        )
        const rankedIconId = rankedIcon?.id

        const embed = new Embed()
            .setColor(color ?? '#F1C40F')
            .setTitle(top1.songName)
            .setURL(`https://scoresaber.com/leaderboard/${top1.leaderboardId}`)
            .setThumbnail(top1.songCoverUrl)
            .setDescription(
                `${top1.ranked && rankedIcon ? `<:${rankedIconName}:${rankedIconId}> ` : ''}${bold(`${top1.levelDifficulty.replace('ExpertPlus', 'Expert+')} (${top1.levelGameMode})`)} par ${bold(top1.levelAuthorName)}\n${bold('Date')} : ${time(new Date(top1.timeSet))}`
            )
            .addFields(
                {
                    name: 'Pays',
                    value: `${countryCodeEmoji(top1.scoreSaberCountry)}`,
                    inline: true
                },
                {
                    name: 'Joueur',
                    value: `${userMention(top1.memberId)}`,
                    inline: true
                },
                {
                    name: 'ScoreSaber',
                    value: hyperlink(
                        top1.scoreSaberName,
                        `https://scoresaber.com/u/${top1.scoreSaberId}`
                    ),
                    inline: true
                },
                {
                    name: 'Score',
                    value: `${new Intl.NumberFormat('en-US').format(top1.score)}`,
                    inline: true
                },
                {
                    name: 'Précision',
                    value: `${top1.acc.toFixed(2)}%`,
                    inline: true
                },
                { name: 'Rang 🌍', value: `#${top1.rank}`, inline: true },
                {
                    name: 'BeatSaver',
                    value: hyperlink(
                        'Lien',
                        `https://beatsaver.com/maps/${top1.levelKey}`
                    ),
                    inline: true
                },
                { name: 'BSR', value: `!bsr ${top1.levelKey}`, inline: true },
                top1.replay
                    ? {
                          name: 'Replay',
                          value: hyperlink('Lien', top1.replay),
                          inline: true
                      }
                    : { name: '\u200b', value: '\u200b', inline: true }
            )

        if (top1.beatenScoreSaberId !== '')
            embed.addFields({
                name: 'Bien joué !',
                value: `Tu es passé(e) devant ${hyperlink(top1.beatenScoreSaberName, `https://scoresaber.com/u/${top1.beatenScoreSaberId}`)}`
            })

        const top1paysChannel = guild.channels.cache.find(
            (c) => c.id === config.guild.channels['top-1-pays']
        ) as TextChannel
        await top1paysChannel.send({ embeds: [embed] })
    }

    /**
     * Récupère la liste des joueurs inscrits au top 1 pays
     */
    static async getSubscribed() {
        const subscribed = await PlayerModel.findAll({
            where: { top1: true, leaderboard: 'scoresaber' }
        })
        return subscribed
    }

    /**
     * Inscrit/Désinscrit un membre au top 1 pays
     * @param memberId identifiant Discord du membre
     * @param subscribe
     */
    static async subscribe(memberId: string, subscribe: boolean) {
        await PlayerModel.update(
            { top1: subscribe },
            { where: { memberId: memberId, leaderboard: 'scoresaber' } }
        )
    }
}
