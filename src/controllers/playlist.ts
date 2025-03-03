import { PlaylistError } from '../utils/error.js'
import beatleader from '../controllers/beatleader.js'
import beatsaver from '../controllers/beatsaver.js'
import { GameLeaderboard, Leaderboards } from '../controllers/gameLeaderboard.js'
import { PlayerData } from '../interfaces/player.interface.js'
import { createCanvas, loadImage } from 'canvas'
import config from '../config.json' with { type: 'json' }

type PlaylistFull = {
    playlistTitle: string,
    playlistAuthor: string,
    playlistDescription: string,
    image: string,
    songs: PlaylistSong[]
}

type PlaylistSong = {
    hash: string,
    songName: string,
    difficulties: Array<{ characteristic: string, name: string }>
}

enum PlaylistType {
    Played,
    Ranked,
    Snipe,
    ClanWars
}

export default class Playlist {
    static playlistAuthor: string = 'Cube Stalker'

    private static getDescription() {
        const createdDate = new Intl.DateTimeFormat('FR-fr', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())
        const playlistDescription = `Playlist générée par Cube-Stalker le ${createdDate.split(' ').join(' à ')}`
        return playlistDescription
    }

    private static async getImage(type: PlaylistType, leaderboard: Leaderboards, playerData?: PlayerData) {
        const canvas = createCanvas(300, 300)
        const ctx = canvas.getContext('2d')

        switch(type) {
            case PlaylistType.Played: {
                const avatar = await loadImage(playerData ? playerData.avatar : '')
                ctx.drawImage(avatar, 0, 0, 300, 300)

                const ldIcon = await loadImage(`./assets/images/card/${leaderboard === Leaderboards.ScoreSaber ? 'ss' : (leaderboard === 'beatleader' ? 'bl' : '')}.png`)
                ctx.drawImage(ldIcon, canvas.width - 70, 10, 60, 60)

                break
            }
            case PlaylistType.Ranked: {
                const ldIcon = await loadImage(`./assets/images/card/${leaderboard === Leaderboards.ScoreSaber ? 'ss' : (leaderboard === 'beatleader' ? 'bl' : '')}.png`)
                ctx.drawImage(ldIcon, 0, 0, 300, 300)

                break
            }
            case PlaylistType.Snipe: {
                const avatar = await loadImage(playerData ? playerData.avatar : '')
                ctx.drawImage(avatar, 0, 0, 300, 300)

                const ldIcon = await loadImage(`./assets/images/card/${leaderboard === Leaderboards.ScoreSaber ? 'ss' : (leaderboard === 'beatleader' ? 'bl' : '')}.png`)
                ctx.drawImage(ldIcon, canvas.width - 70, 10, 60, 60)

                const pepeBox = await loadImage(`./assets/images/pepe_box.png`)
                ctx.drawImage(pepeBox, 0, canvas.height - pepeBox.height, pepeBox.width, pepeBox.height)

                break
            }
            case PlaylistType.ClanWars: {
                const ldIcon = await loadImage(`./assets/images/card/${leaderboard === Leaderboards.ScoreSaber ? 'ss' : (leaderboard === 'beatleader' ? 'bl' : '')}.png`)
                ctx.drawImage(ldIcon, 0, 0, 300, 300)

                const pepeBox = await loadImage(`./assets/images/pepe_box.png`)
                ctx.drawImage(pepeBox, 0, canvas.height - pepeBox.height, pepeBox.width, pepeBox.height)

                break
            }
        }

        const image = canvas.toDataURL()
        return image
    }

    static async getPlayed(leaderboard: Leaderboards, playerId: string, starsMin: number, starsMax: number, accMin: number, accMax: number) {
        // Récupération des scores
        const gameLeaderboard = new GameLeaderboard(leaderboard)
        const playerScores = await gameLeaderboard.requests.getPlayerScores(playerId)
        const playerScoresFiltered = playerScores.filter(ps => {
            if(!ps.ranked || ps.maxScore === 0) return false
            const acc = ps.score / ps.maxScore * 100
            return ps.stars >= starsMin && ps.stars <= starsMax && acc >= accMin && acc <= accMax
        })

        if(playerScoresFiltered.length === 0) throw new PlaylistError('Aucune map correspondant aux critères choisis n\'a été trouvée')

        // Récupération des informations sur le joueur
        const playerData = await gameLeaderboard.requests.getPlayerData(playerId)

        // Génération du fichier playlist
        const playlistName = `[${leaderboard === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}] Maps jouées ${starsMin}⭐ à ${starsMax}⭐ - ${accMin}% à ${accMax}%`

        const playlist: PlaylistFull = {
            playlistTitle: playlistName,
            playlistAuthor: this.playlistAuthor,
            playlistDescription: this.getDescription(),
            image: await this.getImage(PlaylistType.Played, leaderboard, playerData),
            songs: []
        }

        const hashes = []
        for(const score of playerScoresFiltered) {
            const songName = `${score.songName}${score.songSubName !== '' ? ` ${score.songSubName}` : ''} - ${score.songAuthorName}`
            const diff = leaderboard === Leaderboards.ScoreSaber ? score.difficultyRaw.split('_')[1].toLowerCase().replace('expertplus', 'expertPlus') : score.difficultyRaw.toLowerCase().replace('expertplus', 'expertPlus')

            const index = hashes.indexOf(score.songHash)
            if(index < 0) {
                hashes.push(score.songHash)
                const song = { hash: score.songHash, songName: songName, difficulties: [{ characteristic: 'Standard', name: diff }] }
                playlist.songs.push(song)
            } else {
                const song = playlist.songs[index]
                const difficulty = { characteristic: 'Standard', name: diff }
                song.difficulties.push(difficulty)
            }
        }

        return playlist
    }

    static async getRanked(leaderboard: Leaderboards, starsMin: number, starsMax: number) {
        // Génération du fichier playlist
        const playlistName = `[${leaderboard === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}] Maps ranked ${starsMin}⭐ à ${starsMax}⭐`

        const playlist: PlaylistFull = {
            playlistTitle: playlistName,
            playlistAuthor: this.playlistAuthor,
            playlistDescription: this.getDescription(),
            image: await this.getImage(PlaylistType.Ranked, leaderboard),
            songs: []
        }

        const maps = await beatsaver.searchRanked(leaderboard, starsMin, starsMax)
        
        if(maps.length === 0) throw new PlaylistError('Aucune map ranked correspondant aux critères choisis n\'a été trouvée')

        for(const map of maps) {
            const version = map.versions[map.versions.length - 1]
            const hash = version.hash
            const songName = `${map.metadata.songName}${map.metadata.songSubName !== '' ? ` ${map.metadata.songSubName}` : ''} - ${map.metadata.levelAuthorName}`
            const difficulties = version.diffs.map(d => {
                return {
                    characteristic: d.characteristic,
                    name: d.difficulty.toLowerCase().replace('expertplus', 'expertPlus')
                }
            })

            const song = { hash: hash, songName: songName, difficulties: difficulties }
            playlist.songs.push(song)
        }

        return playlist
    }

    static async getSnipe(leaderboard: Leaderboards, playerId: string, playerToSnipeId: string) {
        // Récupération des scores des joueurs
        const gameLeaderboard = new GameLeaderboard(leaderboard)
        const playerToSnipe = await gameLeaderboard.requests.getPlayerData(playerToSnipeId)
        const playerScores = await gameLeaderboard.requests.getPlayerScores(playerId)
        const playerToSnipeScores = await gameLeaderboard.requests.getPlayerScores(playerToSnipeId)

        const scoresToSnipe = []
        for(const s1 of playerToSnipeScores) {
            if(playerScores.find(s2 => s1.songHash === s2.songHash && s1.difficulty === s2.difficulty && s1.gameMode === s2.gameMode && s2.score < s1.score)) {
                scoresToSnipe.push(s1)
            }
        }

        if(scoresToSnipe.length === 0) throw new PlaylistError('Aucune map à sniper n\'a été trouvée')

        // Génération du fichier playlist
        const playlistName = `[${leaderboard === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}] Snipe ${playerToSnipe.name}`

        const playlist: PlaylistFull = {
            playlistTitle: playlistName,
            playlistAuthor: this.playlistAuthor,
            playlistDescription: this.getDescription(),
            image: await this.getImage(PlaylistType.Snipe, leaderboard, playerToSnipe),
            songs: []
        }

        const hashes = []
        for(const score of scoresToSnipe) {
            const songName = `${score.songName}${score.songSubName !== '' ? ` ${score.songSubName}` : ''} - ${score.songAuthorName}`
            const diff = leaderboard === Leaderboards.ScoreSaber ? score.difficultyRaw.split('_')[1].toLowerCase().replace('expertplus', 'expertPlus') : score.difficultyRaw.toLowerCase().replace('expertplus', 'expertPlus')

            const index = hashes.indexOf(score.songHash)
            if(index < 0) {
                hashes.push(score.songHash)
                const song = { hash: score.songHash, songName: songName, difficulties: [{ characteristic: 'Standard', name: diff }] }
                playlist.songs.push(song)
            } else {
                const song = playlist.songs[index]
                const difficulty = { characteristic: 'Standard', name: diff }
                song.difficulties.push(difficulty)
            }
        }

        return playlist
    }

    static async getClan() {
        const bsfrClanId = config.beatleader.clan.id
        const clanMaps = await beatleader.getClanMaps(bsfrClanId)

        if(!clanMaps || clanMaps.length === 0) throw new PlaylistError('Aucune map à conquerir n\'a été trouvée')

        // Génération du fichier playlist
        const playlistName = `[BeatLeader] Guerre de clans`

        const playlist: PlaylistFull = {
            playlistTitle: playlistName,
            playlistAuthor: this.playlistAuthor,
            playlistDescription: this.getDescription(),
            image: await this.getImage(PlaylistType.ClanWars, Leaderboards.BeatLeader),
            songs: []
        }

        const hashes = []
        for(const map of clanMaps) {
            const songName = `${map.leaderboard.song.name}${map.leaderboard.song.subName !== '' ? ` ${map.leaderboard.song.subName}` : ''} - ${map.leaderboard.song.author}`
            const diff = map.leaderboard.difficulty.difficultyName.toLowerCase().replace('expertplus', 'expertPlus')

            const index = hashes.indexOf(map.leaderboard.song.hash)
            if(index < 0) {
                hashes.push(map.leaderboard.song.hash)
                const song = { hash: map.leaderboard.song.hash, songName: songName, difficulties: [{ characteristic: 'Standard', name: diff }] }
                playlist.songs.push(song)
            } else {
                const song = playlist.songs[index]
                const difficulty = { characteristic: 'Standard', name: diff }
                song.difficulties.push(difficulty)
            }
        }

        return playlist
    }
}