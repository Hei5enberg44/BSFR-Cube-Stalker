const { createCanvas, loadImage, registerFont } = require('canvas')
const scoresaber = require('./scoresaber')
const tmp = require('tmp')
const fs = require('fs')

registerFont('./assets/fonts/NeonTubes2.otf', { family: 'Neon Tubes' })

// const removeSpecialChars = (text) => text.replace(/[]/ig, ' ')

function getDiffColor(diff) {
    switch(diff) {
        case 'Easy':
            return '#3CB371'
        case 'Normal':
            return '#59B0F4'
        case 'Hard':
            return '#FF6347'
        case 'Expert':
            return '#BF2A42'
        case 'Expert+':
            return '#8F48DB'
    }
}

module.exports = {
    getCard: async function(scoreSaberId) {
        const player = await scoresaber.getPlayerDatas(scoreSaberId)

        const canvas = createCanvas(950, 380)
        const ctx = canvas.getContext('2d')

        // Progression du joueur dans le classement au cours des 7 derniers jours
        const history = player.history.split(',')
        const diff = history[history.length - 7] ? history[history.length - 7] - player.rank : 0

        const rankColor = player.countryRank === 1 ? '#FFD700' : (player.countryRank === 2 ? '#C0C0C0' : (player.countryRank === 3 ? '#CD7F32' : '#FFFFFF'))

        // Fond
        const background = await loadImage('./assets/images/card/background.png')
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

        // Avatar
        ctx.save()
        const avatar = await loadImage(player.avatar)
        ctx.globalAlpha = 0.8
        ctx.lineWidth = 5
        ctx.strokeStyle = rankColor
        ctx.beginPath()
        ctx.arc(110, 110, 50, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.stroke()
        ctx.clip()
        ctx.globalAlpha = 1
        ctx.drawImage(avatar, 56, 56, 110, 110)
        ctx.restore()

        // Pseudo du joueur
        ctx.font = '40px "Neon Tubes"'
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowColor = 'black'
        ctx.shadowBlur = 8
        ctx.fillText(player.name, 186, 100, 504)

        // Drapeau
        const flagPath = `./assets/images/card/flags/${player.country.toUpperCase()}.png`
        if(fs.existsSync(flagPath)) {
            const flag = await loadImage(flagPath)
            ctx.drawImage(flag, 186, 122, 36, 36)
        }

        // Classement du joueur dans son pays
        const countryRankWidth = (player.countryRank).toString().length * 18 + 22
        ctx.font = '36px "Neon Tubes"'
        ctx.fillText(`#${player.countryRank}`, 242, 155)

        // Globe
        const earth = await loadImage('./assets/images/card/earth.png')
        ctx.drawImage(earth, 242 + countryRankWidth + 40, 122, 36, 36)

        // Classement mondial du joueur
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(`#${player.rank} ${diff > 0 ? `(+${diff})` : (diff == 0 ? '' : `(${diff})`)}`, 242 + countryRankWidth + 96, 155)

        // Nombre de PP
        const pp = `${Intl.NumberFormat('en-US').format(player.pp)}PP`
        ctx.fillText(pp, canvas.width - ctx.measureText(pp).width - 56, 100)

        // Précision
        const acc = `${(player.averageRankedAccuracy).toFixed(2)}%`
        ctx.fillText(acc, canvas.width - ctx.measureText(acc).width - 56, 155)

        // Top PP
        ctx.font = '30px "Neon Tubes"'
        ctx.fillText(`Top PP :`, 56, 214)

        // Image Top PP
        const songCover = await loadImage(player.topPP.cover)
        ctx.drawImage(songCover, 66, 236, 90, 90)

        // Difficulté Top PP
        const top = 236 - 10
        const left = 66 - 10
        const radius = 5
        const width = 68
        const height = 24
        ctx.beginPath()
        ctx.moveTo(left + radius, top)
        ctx.arcTo(left + width, top, left + width, top + height, radius)
        ctx.arcTo(left + width, top + height, left, top + height, radius)
        ctx.arcTo(left, top + height, left, top, radius)
        ctx.arcTo(left, top, left + width, top, radius)
        ctx.closePath()
        ctx.fillStyle = getDiffColor(player.topPP.difficulty)
        ctx.fill()
        ctx.font = 'bold 15px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(`${(player.topPP.stars).toFixed(2)}★`, left + (player.topPP.stars > 9 ? 4 : 11), top + 18)

        // Détails Top PP
        ctx.font = '24px "Franklin Gothic Medium"'
        ctx.fillStyle = '#CCCCCC'
        ctx.fillText(player.topPP.name.length > 80 ? player.topPP.name.substring(0, 80) + '...' : player.topPP.name, 186, 259, 708)
        ctx.fillText(`Mapped by ${player.topPP.author}`, 186, 289, 708)
        ctx.fillText(`#${player.topPP.rank} | ${(player.topPP.pp).toFixed(2)}pp | ${(player.topPP.acc).toFixed(2)}%`, 186, 319)

        // Grille (pour tests)
        // ctx.beginPath()
        // ctx.moveTo(0, 56)
        // ctx.lineTo(950, 56)
        // ctx.strokeStyle = 'yellow'
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(0, 111)
        // ctx.lineTo(950, 111)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(0, 166)
        // ctx.lineTo(950, 166)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(0, 186)
        // ctx.lineTo(950, 186)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(0, 216)
        // ctx.lineTo(950, 216)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(0, 236)
        // ctx.lineTo(950, 236)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(0, 266)
        // ctx.lineTo(950, 266)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(0, 296)
        // ctx.lineTo(950, 296)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(0, 326)
        // ctx.lineTo(950, 326)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(56, 0)
        // ctx.lineTo(56, 380)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(166, 0)
        // ctx.lineTo(166, 380)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(186, 0)
        // ctx.lineTo(186, 380)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(690, 0)
        // ctx.lineTo(690, 380)
        // ctx.stroke()

        // ctx.beginPath()
        // ctx.moveTo(894, 0)
        // ctx.lineTo(894, 380)
        // ctx.stroke()

        // Enregistrement de l'image dans un fichier temporaire
        const base64Image = canvas.toDataURL().split(';base64,').pop()

        const tmpCard = tmp.fileSync()
        fs.writeFileSync(tmpCard.name, base64Image, {encoding: 'base64'})

        return tmpCard
    }
}