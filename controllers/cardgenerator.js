const { createCanvas, loadImage, registerFont } = require('canvas')
const ffmpeg = require('fluent-ffmpeg')
const {execFile} = require('child_process')
const gifsicle = require('gifsicle')
const scoresaber = require('./scoresaber')
const tmp = require('tmp')
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

        const rankColor = player.countryRank === 1 ? '#FFD700' : (player.countryRank === 2 ? '#C0C0C0' : (player.countryRank === 3 ? '#CD7F32' : '#FFFFFF'))

        // Avatar
        ctx.save()
        const avatar = await loadImage(player.avatar)
        ctx.globalAlpha = 0.8
        ctx.lineWidth = 6
        ctx.strokeStyle = rankColor
        ctx.beginPath()
        ctx.arc(130, 120, 50, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.stroke()
        ctx.clip()
        ctx.globalAlpha = 1
        ctx.drawImage(avatar, 80, 70, 100, 100)
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
        ctx.fillText(pp, canvas.width - ctx.measureText(pp).width - 90, 113)

        // Précision
        const acc = `${(player.averageRankedAccuracy).toFixed(2)}%`
        ctx.fillText(acc, canvas.width - ctx.measureText(acc).width - 90, 153)

        // Top PP
        ctx.fillText(`Top PP :`, 80, 240)
        ctx.font = '22px "Neon Tubes"'
        ctx.fillText(player.topPP.songDetails, 80, 270, 800)
        ctx.fillText(`Rank: #${player.topPP.rank} | Score: ${Intl.NumberFormat('en-US').format(player.topPP.score)} | PP: ${player.topPP.pp} | Acc: ${(player.topPP.acc).toFixed(2)}%`, 80, 300)
        ctx.globalAlpha = 1

        // Fusion du texte et du background puis enregistrement du fichier
        const cardPath = `./assets/images/card/cache/${scoreSaberId}.gif`
        const optimizedCardPath = `./assets/images/card/cache/${scoreSaberId}_o.gif`
        const base64Image = canvas.toDataURL().split(';base64,').pop()

        const tmpOverlay = tmp.fileSync()
        fs.writeFileSync(tmpOverlay.name, base64Image, {encoding: 'base64'})

        await new Promise(resolve => {
            ffmpeg()
                .input('./assets/images/card/background.gif')
                .input(tmpOverlay.name)
                .complexFilter([
                    '[0:v]scale=950:380[gif]',
                    '[1:v]scale=950:380[text]',
                    '[gif][text]overlay=0:0:format=rgb[overlayed]',
                    '[overlayed]split[a][b]',
                    '[a]palettegen=stats_mode=single[palette]',
                    '[b][palette]paletteuse=bayer:bayer_scale=5[output]'
                ])
                .outputOptions([
                    '-map [output]',
                    '-loop 0'
                ])
                .outputFPS(20)
                .output(cardPath)
                .on('end', function() {
                    resolve()
                })
                .run()
        })

        await new Promise(resolve => {
            execFile(gifsicle, ['--lossy=50', cardPath, '-o', optimizedCardPath], err => {
                if(!err) resolve()
            })
        })

        fs.unlinkSync(cardPath)

        return optimizedCardPath
    }
}