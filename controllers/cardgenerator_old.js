const { createCanvas, loadImage, registerFont } = require('canvas')
const GIFEncoder = require('gif-encoder-2')
const scoresaber = require('./scoresaber')
const fs = require('fs')

registerFont('./assets/fonts/NeonTubes2.otf', { family: 'Neon Tubes' })

module.exports = {
    getCard: async function(scoreSaberId, gif) {
        const player = await scoresaber.getPlayerDatas(scoreSaberId)
        const filePath = `./assets/images/card/cache`

        if(gif) {
            // Si gif = true, création d'une carte annimée
            const encoder = new GIFEncoder(1398, 960, 'neuquant', true)
            encoder.createReadStream().pipe(fs.createWriteStream(`${filePath}/${scoreSaberId}.gif`))

            encoder.start();
            encoder.setRepeat(0)
            encoder.setDelay(3000)
            encoder.setQuality(30)

            const frame1 = await module.exports.generateImage(player, 'pp', gif)
            const frame2 = await module.exports.generateImage(player, 'acc', gif)

            encoder.addFrame(frame1) // carte pp
            encoder.addFrame(frame2) // carte acc
            encoder.finish()

            return { files: [`${filePath}/${scoreSaberId}.gif`] }
        } else {
            // Sinon, création d'une carte statique affichant les pp
            const card = await module.exports.generateImage(player, 'pp', gif)
            const base64Image = card.toDataURL().split(';base64,').pop()

            fs.writeFileSync(`${filePath}/${scoreSaberId}.png`, base64Image, {encoding: 'base64'})

            return { files: [`${filePath}/${scoreSaberId}.png`] }
        }
    },

    generateImage: async function(player, type, gif) {
        const canvas = createCanvas(1398, 960)
        const ctx = canvas.getContext('2d')
        
        // Progression du joueur dans le classement au cours des 7 derniers jours
        const history = player.history.split(',')
        const diff = history[history.length - 7] ? history[history.length - 7] - player.rank : 0

        // On détermine le fond de la carte en fonction de cette progression
        const mode = diff >= 0 ? (diff === 0 ? 'confused' : 'stonks') : 'notstonks'

        // Image de fond
        const background = await loadImage(`./assets/images/card/bg_${mode}.png`)
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

        // Pseudo du joueur
        ctx.font = '85px "Neon Tubes"'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(player.name, gif ? 300 : 400, canvas.height - 150)

        // Drapeau
        const flagPath = `./assets/images/card/flags/${player.country.toUpperCase()}.png`
        if(fs.existsSync(flagPath)) {
            const flag = await loadImage(flagPath)
            ctx.drawImage(flag, 70, canvas.height - 215, 150, 150)
        
            ctx.globalAlpha = 0.5
            const black = await loadImage('./assets/images/card/circle_black.png')
            ctx.drawImage(black, 70, canvas.height - 215, 150, 150)
            ctx.globalAlpha = 1
        }

        // Rang du joueur dans son pays
        ctx.font = '58px "Neon Tubes"'
        ctx.fillStyle = '#FFFFFF'
        ctx.textAlign = 'center'
        ctx.fillText(`#${player.countryRank}`, 142, canvas.height - 117, 140)

        ctx.save()

        // Photo de profil du joueur
        const avatar = await loadImage(player.avatar)
        
        let change, color, str = ''
        switch(mode) {
            case 'stonks':
                ctx.beginPath()
                ctx.arc(330, 180, 150, 0, Math.PI * 2, true)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(avatar, 180, 30, 300, 300)
                
                str = '+'
                change = await loadImage('./assets/images/card/circle_green.png')
                color = '#FFFFFF'
                break
            case 'notstonks':
                ctx.beginPath()
                ctx.arc(280, 155, 150, 0, Math.PI * 2, true)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(avatar, 130, 5, 300, 300)
                
                str = '-'
                change = await loadImage('./assets/images/card/circle_red.png')
                color = '#FFFFFF'
                break
            default:
                ctx.beginPath()
                ctx.arc(300, 180, 150, 0, Math.PI * 2, true)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(avatar, 150, 30, 300, 300)
                
                change = await loadImage('./assets/images/card/circle_yellow.png')
                color = '#000000'
                break
        }

        ctx.restore()

        // Carte pp
        if(type === 'pp' || !gif) {
            // Progression du joueur dans le classement au cours des 7 derniers jours
            ctx.drawImage(change, 300, canvas.height - 130, 70, 70)
            ctx.font = 'Bold 32px "Neon Tubes"'
            ctx.fillStyle = color
            ctx.textAlign = 'center'
            ctx.fillText(str + Math.abs(diff), 335, canvas.height - 83)

            // Rang global du joueur
            ctx.font = '62px "Neon Tubes"'
            ctx.fillStyle = '#FFFFFF'
            ctx.textAlign = 'left'
            ctx.fillText(`#${player.rank} (${Intl.NumberFormat('en-US').format(player.pp)}pp)`, 400, canvas.height - 70)
        }

        // Carte acc
        if(type === 'acc' || !gif) {
            let rank = 'SS'
            let accuracy = parseFloat((player.averageRankedAccuracy).toFixed(2))
            if (accuracy >= 80 && accuracy < 90) {
                rank = 'S'
            } else if (accuracy >= 65 && accuracy < 80) {
                rank = 'A'
            } else if (accuracy >= 50 && accuracy < 65) {
                rank = 'B'
            } else if (accuracy >= 35 && accuracy < 50) {
                rank = 'C'
            } else if (accuracy >= 0 && accuracy < 35) {
                rank = 'D'
            }

            if(!gif) {
                // Rang acc du joueur
                let rankPic = await loadImage('./assets/images/card/ranks/' + rank + '.png')
                ctx.drawImage(rankPic, 310, canvas.height - 220, 55, 70)
            } else {
                // Rang acc du joueur
                let rankPic = await loadImage('./assets/images/card/ranks/' + rank + '.png')
                ctx.drawImage(rankPic, 300, canvas.height - 130, 55, 70)

                // Précision du joueur
                ctx.font = '62px "Neon Tubes"'
                ctx.fillStyle = '#FFFFFF'
                ctx.textAlign = 'left'
                ctx.fillText(accuracy + "%", 400, canvas.height - 70)
            }
        }

        return gif ? ctx : canvas
    }
}