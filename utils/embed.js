const { EmbedBuilder } = require('discord.js')
const config = require('../config.json')

module.exports = class Embed extends EmbedBuilder {
    constructor(data) {
        super(data)
        this.setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })
    }
}