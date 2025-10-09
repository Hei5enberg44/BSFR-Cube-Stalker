import { EmbedBuilder, EmbedData } from 'discord.js'

export default class Embed extends EmbedBuilder {
    constructor(data?: EmbedData) {
        super(data)
    }
}
