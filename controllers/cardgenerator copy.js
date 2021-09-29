const { createCanvas, loadImage, registerFont } = require('canvas')
const GIFEncoder = require('gif-encoder-2')
const scoresaber = require('./scoresaber')
const fs = require('fs')

registerFont('./assets/fonts/NeonTubes2.otf', { family: 'Neon Tubes' })

// const removeSpecialChars = (text) => text.replace(/[]/ig, ' ')

module.exports = {
    getCard: async function(scoreSaberId) {
        const player = await scoresaber.getPlayerDatas(scoreSaberId)

        const canvas = createCanvas(950, 380)
        const ctx = canvas.getContext('2d')

        // Progression du joueur dans le classement au cours des 7 derniers jours
        const history = player.history.split(',')
        const diff = history[history.length - 7] ? history[history.length - 7] - player.rank : 0

        // Image de fond
        const radius = 25
        const width = canvas.width
        const height = canvas.height
        ctx.save()
        const background = await loadImage('./assets/images/card/background.jpg')
        ctx.beginPath()
        ctx.moveTo(radius, 0)
        ctx.lineTo(width - radius, 0)
        ctx.quadraticCurveTo(width, 0, width, radius)
        ctx.lineTo(width, height - radius)
        ctx.quadraticCurveTo(width, height, width - radius, height)
        ctx.lineTo(radius, height)
        ctx.quadraticCurveTo(0, height, 0, height - radius)
        ctx.lineTo(0, radius)
        ctx.quadraticCurveTo(0, 0, radius, 0)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(background, -74, -65, canvas.width + 146, canvas.height + 130)
        ctx.restore()

        const rankColor = player.countryRank === 1 ? '#FFD700' : (player.countryRank === 2 ? '#C0C0C0' : (player.countryRank === 3 ? '#CD7F32' : '#FFFFFF'))

        // Avatar
        ctx.save()
        const avatar = await loadImage(player.avatar)
        ctx.globalAlpha = 0.8
        ctx.lineWidth = 6
        ctx.strokeStyle = rankColor
        ctx.beginPath()
        ctx.arc(120, 120, 50, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.stroke()
        ctx.clip()
        ctx.globalAlpha = 1
        ctx.drawImage(avatar, 70, 70, 100, 100)
        ctx.restore()

        // Pseudo du joueur
        ctx.globalAlpha = 0.8
        ctx.font = '30px "Neon Tubes"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(player.name, 205, 113)
        ctx.globalAlpha = 1

        // Drapeau
        const flagPath = `./assets/images/card/flags/${player.country.toUpperCase()}.png`
        if(fs.existsSync(flagPath)) {
            const flag = await loadImage(flagPath)
            ctx.drawImage(flag, 205, 126, 30, 30)
        }

        // Classement du joueur dans son pays
        const countryRankWidth = (player.countryRank).toString().length * 18 + 22
        ctx.globalAlpha = 0.8
        ctx.fillStyle = rankColor
        ctx.fillText(`#${player.countryRank}`, 245, 153)
        ctx.globalAlpha = 1

        // Globe
        const earth = await loadImage('./assets/images/card/earth.png')
        ctx.drawImage(earth, 245 + countryRankWidth + 20, 126, 30, 30)

        // Classement mondial du joueur
        ctx.globalAlpha = 0.8
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(`#${player.rank} ${diff > 0 ? `(+${diff})` : (diff == 0 ? '' : `(${diff})`)}`, 245 + countryRankWidth + 60, 153)

        // Nombre de PP
        const pp = `${player.pp}PP`
        ctx.fillText(pp, canvas.width - ctx.measureText(pp).width - 80, 113)

        // Précision
        const acc = `${(player.averageRankedAccuracy).toFixed(2)}%`
        ctx.fillText(acc, canvas.width - ctx.measureText(acc).width - 80, 153)

        // Top PP
        ctx.fillText(`Top PP :`, 70, 240)
        ctx.font = '22px "Neon Tubes"'
        ctx.fillText(player.topPP.songDetails, 70, 270, 800)
        ctx.fillText(`Rank: #${player.topPP.rank} | Score: ${Intl.NumberFormat('en-US').format(player.topPP.score)} | PP: ${player.topPP.pp}`, 70, 300)
        ctx.globalAlpha = 1

        return canvas.toBuffer()
    }
}