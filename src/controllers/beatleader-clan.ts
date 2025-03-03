import { WebSocket } from 'ws'
import puppeteer from 'puppeteer'
import GIFEncoder from 'gifencoder'
import { createCanvas, loadImage } from 'canvas'
import { Client, Guild, TextChannel, BaseMessageOptions, MessageFlags, AttachmentBuilder, bold, hyperlink } from 'discord.js'
import Embed from '../utils/embed.js'
import beatleader from './beatleader.js'
import { ClanRanking, ClanRankingData, ClanRankingScore, ClanRankingChange } from '../interfaces/clan.interface.js'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

enum GlobalMapEvent {
    create = 0,
    dismantle = 1,
    kick = 2,
    join = 3,
    reject = 4,
    leave = 5,
    score = 6,
    ranked = 7,
    priorityChange = 8,
    ban = 9,
    unban = 10,
    suspend = 11,
    unsuspend = 12
}

export default class BeatLeaderClan {
    private static client: Client

    /**
     * Scan pour des captures de maps pour la clan wars BeatLeader
     * @param client client Discord
     */
    static listen(client: Client) {
        const self = this
        this.client = client
        let pingInterval: NodeJS.Timeout

        Logger.log('ClanWars', 'INFO', 'Écoute des captures de maps pour la clan wars BeatLeader')

        const ws = new WebSocket('wss://sockets.api.beatleader.xyz/clansocket', {
            followRedirects: true
        })

        ws.on('open', () => {
            pingInterval = setInterval(() => {
                ws.send('ping')
            }, 5000)
        })

        ws.on('message', async (data: Buffer) => {
            const pong = Buffer.from([138, 0])
            if(!data.equals(pong)) {
                try {
                    const message = Buffer.from(data).toString()
                    const parsedData: ClanRanking = JSON.parse(message)
                    await this.processCapture(parsedData)
                } catch(err) {
                    Logger.log('ClanWars', 'ERROR', 'Le traitement du message websocket à échoué')
                }
            }
        })

        ws.on('close', () => {
            clearInterval(pingInterval)
            Logger.log('ClanWars', 'WARNING', 'Le websocket de BeatLeader s\'est fermé')
            setTimeout(function() {
                self.listen(client)
            }, 60 * 1000)
        })
    }

    static async processCapture(data: ClanRanking) {
        if(data.message !== 'globalmap') return

        const bsfrClanId = config.beatleader.clan.id
        const captureData = data.data
        const changes = captureData.changes !== null ? captureData.changes.filter(c => c.currentCaptorId === bsfrClanId || c.previousCaptorId === bsfrClanId) : null

        if(changes !== null && changes.length > 0) {
            const message = await this.getActionMessage(captureData)
            if(message !== null) await this.postChangesWithMessage(changes, message)
            if(captureData.score !== null) await this.postChangesWithScore(changes, captureData.score)
        }
    }

    static async getActionMessage(captureData: ClanRankingData) {
        if(captureData.playerAction === GlobalMapEvent.ranked) return 'Un nouveau lot de maps a été classé, ce qui a'
        if(captureData.playerId === null) return null

        const player = await beatleader.getPlayerData(captureData.playerId)
        switch(captureData.playerAction) {
            case GlobalMapEvent.priorityChange:
                return `${player.name} a changé l'ordre du clan ce qui a`
            case GlobalMapEvent.ban:
                return `${player.name} a été banni ce qui a`
            case GlobalMapEvent.unban:
                return `${player.name} a été débanni ce qui a`
            case GlobalMapEvent.suspend:
                return `${player.name} a suspendu son profil ce qui a`
            case GlobalMapEvent.unsuspend:
                return `${player.name} a réactivé son profil ce qui a`
            default:
                break
        }

        if(captureData.clanId === null) return null
        const clan = await beatleader.getClanById(captureData.clanId)

        switch(captureData.playerAction) {
            case GlobalMapEvent.create:
                return `${player.name} a créé [${clan.container.tag}] ce qui a`
            case GlobalMapEvent.dismantle:
                return `${player.name} a démantelé [${clan.container.tag}] ce qui a`
            case GlobalMapEvent.kick:
                return `${player.name} a été exclu(e) de [${clan.container.tag}] ce qui a`
            case GlobalMapEvent.join:
                return `${player.name} a rejoint [${clan.container.tag}] ce qui a`
            case GlobalMapEvent.leave:
                return `${player.name} a quitté [${clan.container.tag}] ce qui a`
            default:
                break
        }

        return null
    }

    static async postChangesWithMessage(changes: ClanRankingChange[], postMessage: string) {
        if(changes.length > 10) {
            for(let i = 0; i < changes.length; i += 10) {
                await this.postChangesWithMessage(changes.slice(i, i + 10), postMessage)
            }
        } else {
            let message = `${bold(postMessage)}\n`
            for(const change of changes) {
                const leaderboard = change.leaderboardId !== null ? await beatleader.getMapLeaderboardById(change.leaderboardId) : null
                const currentCaptor = change.currentCaptorId !== null ? await beatleader.getClanById(change.currentCaptorId) : null
                const previousCaptor = change.previousCaptorId !== null ? await beatleader.getClanById(change.previousCaptorId) : null
                const songName = leaderboard?.song.name
                const songDifficulty = leaderboard?.difficulty.difficultyName

                if(!currentCaptor)
                    message += 'effectué une égalité sur '
                else
                    message += 'capturé '

                if(songName && songDifficulty)
                    message += `${hyperlink(`[${songName} - ${songDifficulty}]`, `https://beatleader.net/leaderboard/clanranking/${change.leaderboardId}`)}`

                if(currentCaptor) {
                    message += ` pour ${bold(`[${currentCaptor.container.tag}]`)}`
                    if(previousCaptor)
                        message += ` depuis ${bold(`[${previousCaptor.container.tag}]`)}`
                }

                message += '\n'
            }

            const guild = <Guild>this.client.guilds.cache.find(g => g.id === config.guild.id)
            const clanUpdatesChannel = <TextChannel>guild.channels.cache.find(c => c.id === config.guild.channels['clan-updates'])

            const embed = new Embed()
                .setTitle('Voir les changements sur une carte 🌐')
                .setURL('https://beatleader.net/clansmap')

            await clanUpdatesChannel.send({ content: message, embeds: [ embed ] })
        }
    }

    static async postChangesWithScore(changes: ClanRankingChange[], score: ClanRankingScore) {
        if(changes === null) return

        for(const change of changes) {
            const player = await beatleader.getPlayerData(score.playerId)
            const leaderboard = change.leaderboardId !== null ? await beatleader.getMapLeaderboardById(change.leaderboardId) : null
            const currentCaptor = change.currentCaptorId !== null ? await beatleader.getClanById(change.currentCaptorId) : null
            const previousCaptor = change.previousCaptorId !== null ? await beatleader.getClanById(change.previousCaptorId) : null
            const songName = leaderboard?.song.name
            const songDifficulty = leaderboard?.difficulty.difficultyName

            let message = `${bold(player.name)} `
            if(!currentCaptor)
                message += 'a effectué une égalité sur '
            else
                message += `${bold(`[${currentCaptor.container.tag}]`)} a capturé `

            if(songName && songDifficulty)
                message += `${hyperlink(`[${songName} - ${songDifficulty}]`, `https://beatleader.net/leaderboard/clanranking/${change.leaderboardId}`)} `

            message += `en obtenant ${Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(score.pp)}pp avec ${Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(score.accuracy * 100)}% d'acc${(score.modifiers.length > 0 ? (' et ' + score.modifiers) : '')}.\n`

            if(currentCaptor) {
                if(previousCaptor)
                    message += `Reprenant la map à ${bold(`[${previousCaptor.container.tag}]`)}`
                message += ` ce qui amène ${bold(`[${currentCaptor.container.tag}]`)} à ${Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentCaptor.container.rankedPoolPercentCaptured * 100)}% de domination mondiale !`
            }

            const gif = change.leaderboardId ? await this.getAnimatedScreenshot(change.leaderboardId) : null

            const guild = <Guild>this.client.guilds.cache.find(g => g.id === config.guild.id)
            const clanUpdatesChannel = <TextChannel>guild.channels.cache.find(c => c.id === config.guild.channels['clan-updates'])

            let messageOptions: BaseMessageOptions = { content: message }

            if(gif) {
                const attachment = new AttachmentBuilder(gif, { name: 'clansmap-change.gif' })
                messageOptions = {
                    ...messageOptions,
                    files: [ attachment ]
                }
            }

            await clanUpdatesChannel.send({ ...messageOptions, flags: [ MessageFlags.SuppressEmbeds ] })
        }
    }

    static async getAnimatedScreenshot(leaderboardId: string) {
        const browser = await puppeteer.launch({
            headless: true,
            slowMo: 0
        })
        const page = await browser.newPage()
        page.setViewport({
            width: 620,
            height: 280,
            deviceScaleFactor: 1
        })
        await page.goto(`https://screenshot.beatleader.xyz/clansmap/leaderboard/${leaderboardId}`, {
            waitUntil: [ 'domcontentloaded' ]
        })
    
        const duration = 2
        const frameRate = 60
        const totalFrames = duration * frameRate
        const delayBetweenFrames = 1000 / frameRate

        const frames: Buffer[] = []

        await new Promise(res => setTimeout(res, 600))

        for(let i = 0; i < totalFrames; i++) {
            const screenshot = await page.screenshot({ omitBackground: true })
            if(screenshot.subarray(100, -100).find((value) => value !== 0)) frames.push(Buffer.from(screenshot))
            await new Promise(res => setTimeout(res, delayBetweenFrames))
        }

        await browser.close()

        const encoder = new GIFEncoder(620, 280)
        encoder.setRepeat(-1)
        encoder.setDelay(delayBetweenFrames * 3)
        encoder.setQuality(10)
        encoder.start()

        for(const frame of frames) {
            const canvas = createCanvas(620, 280)
            const ctx = canvas.getContext('2d')
            const image = await loadImage(frame)
            ctx.drawImage(image, 0, 0, image.width, image.height)
            encoder.addFrame(ctx as unknown as CanvasRenderingContext2D)
        }

        encoder.finish()

        return encoder.out.getData()
    }
}