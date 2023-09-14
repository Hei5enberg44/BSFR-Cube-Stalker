import { GuildMember } from 'discord.js'
import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D } from 'canvas'
import sharp from 'sharp'
import tmp from 'tmp'
import * as fs from 'node:fs'
import { Leaderboards } from './gameLeaderboard.js'
import roles from './roles.js'
import { PlayerData, PlayerRanking } from '..//interfaces/player.interface.js'

registerFont('./assets/fonts/Poppins-Regular.ttf', { family: 'Poppins-Regular' })
registerFont('./assets/fonts/Poppins-Medium.ttf', { family: 'Poppins-Medium' })
registerFont('./assets/fonts/Poppins-SemiBold.ttf', { family: 'Poppins-SemiBold' })

// const removeSpecialChars = (text) => text.replace(/[]/ig, ' ')

type difficulties = 'Easy' | 'Normal' | 'Hard' | 'Expert' | 'ExpertPlus'

const getDiffColor = (diff: difficulties) => {
    switch(diff) {
        case 'Easy':
            return '#3CB371'
        case 'Normal':
            return '#59B0F4'
        case 'Hard':
            return '#FF6347'
        case 'Expert':
            return '#BF2A42'
        case 'ExpertPlus':
            return '#8F48DB'
    }
}

const roundedImage = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

const getImageLightness = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let colorSum = 0
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for(let x = 0, len = data.length; x < len; x += 4) {
        const r = data[x]
        const g = data[x+1]
        const b = data[x+2]

        const avg = Math.floor((r + g + b) / 3)
        colorSum += avg
    }

    const brightness = Math.floor(colorSum / (width * height))
    return brightness
}

const lightenDarkenColor = (color: number, magnitude: number) => {
    let r = (color >> 16) + magnitude
    r > 255 && (r = 255)
    r < 0 && (r = 0)
    let g = (color & 0x0000ff) + magnitude
    g > 255 && (g = 255)
    g < 0 && (g = 0)
    let b = ((color >> 8) & 0x00ff) + magnitude
    b > 255 && (b = 255)
    b < 0 && (b = 0)
    const newColor = g | (b << 8) | (r << 16)
    return `#${newColor.toString(16)}`
}

const fittingString = (ctx: CanvasRenderingContext2D, str: string, maxWidth: number) => {
    var width = ctx.measureText(str).width
    var ellipsis = '…'
    var ellipsisWidth = ctx.measureText(ellipsis).width
    if(width <= maxWidth || width <= ellipsisWidth) {
        return str
    } else {
        var len = str.length
        while(width >= maxWidth-ellipsisWidth && len-- > 0) {
            str = str.substring(0, len)
            width = ctx.measureText(str).width
        }
        return str + ellipsis
    }
}

const downloadImage = async (url: string) => {
    const imageRequest = await fetch(url)
    if(!imageRequest.ok) return null
    const imageData = await imageRequest.arrayBuffer()
    const imageBuffer = Buffer.from(imageData)
    const image = await sharp(imageBuffer).toFormat('png').resize(1900).toBuffer()
    return image
}

export default {
    async getCard(leaderboardChoice: Leaderboards, member: GuildMember, playerData: PlayerData, playerLd: PlayerRanking, debug = false) {
        // Fabrication de la carte
        const canvas = createCanvas(1900, 760)
        const ctx = canvas.getContext('2d')
        ctx.textBaseline = 'middle'

        // Fond
        let profileCover = null
        if(playerData.profileCover) profileCover = await downloadImage(playerData.profileCover)
        if(profileCover) {
            const background = await loadImage(profileCover)
            const backgroundY = background.height - canvas.height < 0 ? 0 : -(background.height - canvas.height) / 2

            ctx.save()
            roundedImage(ctx, 0, 0, canvas.width, canvas.height, 20)
            ctx.clip()
            ctx.drawImage(background, 0, backgroundY, canvas.width, backgroundY < 0 ? background.height : canvas.height)
            ctx.restore()

            const brightness = getImageLightness(ctx, canvas.width, canvas.height)
            if(brightness > 150) {
                ctx.save()
                roundedImage(ctx, 0, 0, canvas.width, canvas.height, 20)
                ctx.clip()
                ctx.globalAlpha = 0.5
                ctx.fillStyle = 'black'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.restore()
            }
        } else {
            let colorStart = '#231b60'
            let colorStop = '#d50078'

            const memberPpRoleColor = roles.getMemberPpRoleColor(member)
            if(memberPpRoleColor) {
                colorStart = lightenDarkenColor(memberPpRoleColor, -80)
                colorStop = lightenDarkenColor(memberPpRoleColor, 0)
            }

            const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0)
            gradient.addColorStop(0, colorStart)
            gradient.addColorStop(1, colorStop)

            ctx.beginPath()
            ctx.roundRect(0, 0, canvas.width, canvas.height, 20)
            ctx.fillStyle = gradient
            ctx.fill()
        }

        // Avatar
        ctx.save()
        const avatar = await loadImage(playerData.avatar)
        roundedImage(ctx, 50, 50, 280, 280, 20)
        ctx.clip()
        ctx.drawImage(avatar, 50, 50, 280, 280)
        ctx.restore()

        // Pseudo du joueur
        ctx.font = '76px "Poppins-SemiBold"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(playerData.name, 365, 78, 930)

        // Nombre de PP
        const pp = `${Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(playerData.pp)}pp`
        ctx.font = '76px "Poppins-SemiBold"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(pp, canvas.width - ctx.measureText(pp).width - 40, 78)

        /**
         * Classement Leaderboard
         */
        // Icon Leaderboard
        const ldIcon = await loadImage(`./assets/images/card/${leaderboardChoice === Leaderboards.ScoreSaber ? 'ss' : (leaderboardChoice === 'beatleader' ? 'bl' : '')}.png`)
        ctx.drawImage(ldIcon, 365, 135, 60, 60)

        // Nom Leaderboard
        ctx.font = '50px "Poppins-Medium"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : (leaderboardChoice === 'beatleader' ? 'BeatLeader' : ''), 435, 165)

        // Globe
        const earth = await loadImage('./assets/images/card/earth.png')
        ctx.drawImage(earth, 365, 205, 60, 60)

        // Classement mondial du joueur
        const globalRank = `#${playerData.rank}`
        ctx.font = '50px "Poppins-Regular"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(globalRank, 435, 235)

        // Drapeau Pays Joueur
        const playerCountryFlagLeft = 435 + ctx.measureText(globalRank).width + 30
        const flagPath = `./assets/images/card/flags/${playerData.country.toUpperCase()}.png`
        if(fs.existsSync(flagPath)) {
            const flag = await loadImage(flagPath)
            ctx.drawImage(flag, playerCountryFlagLeft, 205, 60, 60)
        }

        // Classement du joueur dans son pays
        const countryRank = `#${playerData.countryRank}`
        ctx.font = '50px "Poppins-Regular"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(countryRank, playerCountryFlagLeft + 70, 235)

        // Icon Précision
        const dart = await loadImage('./assets/images/card/dart.png')
        ctx.drawImage(dart, 365, 275, 60, 60)

        // Précision
        const acc = `${(playerData.averageRankedAccuracy).toFixed(2)}%`
        ctx.font = '50px "Poppins-Regular"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(acc, 435, 305)

        // Séparateur
        let separatorLeft = ctx.measureText(globalRank).width + ctx.measureText(countryRank).width + 560
        if(separatorLeft < 750) separatorLeft = 750
        ctx.lineWidth = 4
        ctx.strokeStyle = 'white'
        ctx.beginPath()
        ctx.moveTo(separatorLeft, 130)
        ctx.lineTo(separatorLeft, 340)
        ctx.stroke()

        /**
         * Classement Serveur
         */
        // Icône BSFR
        const bsfrIcon = await loadImage(`./assets/images/card/bsfr.png`)
        ctx.drawImage(bsfrIcon, separatorLeft + 30, 135, 60, 60)

        // BSFR
        ctx.font = '50px "Poppins-Medium"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText('BSFR', separatorLeft + 100, 165)

        // Classement pp serveur
        ctx.font = '45px "Poppins-Regular"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(`PP: ${playerLd.serverRankPP}/${playerLd.serverLdTotal}`, separatorLeft + 30, 235)

        // Classement précision serveur
        ctx.font = '45px "Poppins-Regular"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(`Précision: ${playerLd.serverRankAcc}/${playerLd.serverLdTotal}`, separatorLeft + 30, 305)

        /**
         * Bar de progression
         */
        const fromPp = Math.floor(playerData.pp / 1000) * 1000
        const toPp = fromPp + 1000
        const fromPpText = `${Intl.NumberFormat('en-US').format(fromPp)}pp`
        const toPpText = `${Intl.NumberFormat('en-US').format(toPp)}pp`
        const progress = Math.ceil((playerData.pp - fromPp) * 100 / 1000)

        ctx.lineWidth = 4
        ctx.strokeStyle = 'white'

        ctx.beginPath()
        ctx.moveTo(60, 370)
        ctx.lineTo(1840, 370)
        ctx.quadraticCurveTo(1850, 370, 1850, 380)
        ctx.lineTo(1850, 430)
        ctx.quadraticCurveTo(1850, 440, 1840, 440)
        ctx.lineTo(60, 440)
        ctx.quadraticCurveTo(50, 440, 50, 430)
        ctx.lineTo(50, 380)
        ctx.quadraticCurveTo(50, 370, 60, 370)
        ctx.stroke()

        ctx.save()
        roundedImage(ctx, 52, 372, 1796, 66, 8)
        ctx.clip()
        ctx.fillStyle = '#27AE60'
        ctx.fillRect(52, 372, Math.ceil(1796 * progress / 100), 66)
        ctx.restore()

        ctx.font = '50px "Poppins-Regular"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(fromPpText, 65, 405)

        ctx.font = '50px "Poppins-Regular"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(toPpText, canvas.width - ctx.measureText(toPpText).width - 65, 405)

        /**
         * Top PP
         */
        ctx.font = '45px "Poppins-SemiBold"'
        ctx.fillText('T', 52, 495)
        ctx.fillText('O', 48, 540)
        ctx.fillText('P', 52, 585)
        ctx.fillText('P', 52, 650)
        ctx.fillText('P', 52, 695)

        // Image Top PP
        ctx.save()
        const songCover = await loadImage(playerData.topPP ? playerData.topPP.cover : './assets/images/card/cover-default.png')
        roundedImage(ctx, 100, 480, 230, 230, 10)
        ctx.clip()
        ctx.drawImage(songCover, 100, 480, 230, 230)
        ctx.restore()

        // Difficulté Top PP
        if(playerData.topPP) {
            const mapStars = (playerData.topPP.stars).toFixed(2)
            const top = 470
            const left = 190
            const radius = 5
            const width = 150
            const height = 44
            ctx.beginPath()
            ctx.moveTo(left + radius, top)
            ctx.arcTo(left + width, top, left + width, top + height, radius)
            ctx.arcTo(left + width, top + height, left, top + height, radius)
            ctx.arcTo(left, top + height, left, top, radius)
            ctx.arcTo(left, top, left + width, top, radius)
            ctx.closePath()
            ctx.fillStyle = getDiffColor(<difficulties>playerData.topPP.difficulty)
            ctx.fill()
            ctx.font = '40px "Poppins-Medium"'
            ctx.fillStyle = '#FFFFFF'
            const textLeft = left + (width - ctx.measureText(mapStars).width - 40) / 2
            ctx.fillText(mapStars, textLeft, top + 23)
            // Icône Étoile
            const starIcon = await loadImage(`./assets/images/card/star.png`)
            ctx.drawImage(starIcon, ctx.measureText(mapStars).width + textLeft + 5, top + 4, 35, 35)
        }

        // Détails Top PP
        ctx.font = '50px "Poppins-Regular"'
        ctx.fillStyle = '#FFFFFF'
        if(playerData.topPP) {
            ctx.fillText(fittingString(ctx, playerData.topPP.name, 1850), 365, 530, 1485)
            ctx.fillText(`Mapped by ${playerData.topPP.author}`, 365, 595, 1485)
            ctx.fillText(`#${playerData.topPP.rank} | ${(playerData.topPP.pp).toFixed(2)}pp | ${(playerData.topPP.acc).toFixed(2)}% | ${playerData.topPP.fc ? 'FC ✅' : 'FC ❎'}`, 365, 665, 1485)
        } else {
            ctx.fillText(`Tu n'as pas de top PP pour le moment`, 365, 595, 1485)
        }

        // Grille (pour tests)
        if(debug) {
            ctx.lineWidth = 2
            ctx.strokeStyle = 'yellow'

            ctx.beginPath()
            ctx.moveTo(0, 40)
            ctx.lineTo(canvas.width, 40)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(365, 130)
            ctx.lineTo(canvas.width, 130)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(365, 200)
            ctx.lineTo(canvas.width, 200)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(365, 270)
            ctx.lineTo(canvas.width, 270)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(0, 340)
            ctx.lineTo(canvas.width, 340)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(0, 470)
            ctx.lineTo(canvas.width, 470)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(365, 595)
            ctx.lineTo(canvas.width, 595)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(90, 470)
            ctx.lineTo(90, 720)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(0, 720)
            ctx.lineTo(canvas.width, 720)
            ctx.stroke()

            ctx.fillStyle = 'yellow'
            ctx.fillRect(340, 40, 25, 300)

            ctx.fillStyle = 'yellow'
            ctx.fillRect(340, 470, 25, 250)

            ctx.beginPath()
            ctx.moveTo(40, 0)
            ctx.lineTo(40, canvas.height)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(canvas.width - 40, 0)
            ctx.lineTo(canvas.width - 40, canvas.height)
            ctx.stroke()
        }

        // Enregistrement de l'image dans un fichier temporaire
        const base64Image = <string>canvas.toDataURL().split(';base64,').pop()

        const tmpCard = tmp.fileSync()
        fs.writeFileSync(tmpCard.name, base64Image, {encoding: 'base64'})

        return tmpCard
    }
}