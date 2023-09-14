import * as fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, Collection, EmbedBuilder, BaseInteraction } from 'discord.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

interface Modal {
    execute: Function
}

const __dirname = dirname(fileURLToPath(import.meta.url))

export default class Modals {
    client: Client
    modals: Collection<string, Modal> = new Collection()

    /**
     * @param client client Discord
     */
    constructor(client: Client) {
        this.client = client
    }

    /**
     * Chargement des modales au démarrage du Bot
     */
    async load() {
        this.modals = new Collection()
        const modalFiles = fs.readdirSync(resolve(__dirname, '../modals')).filter(file => file.endsWith('.js'))

        // On récupère les modales
        for(const file of modalFiles) {
            const { default: modal } = await import(`../modals/${file}`)
            const name = modal.name || file.split('.')[0]
            Logger.log('ModalManager', 'INFO', `Modale "${name}" trouvée`)
            this.modals.set(name, modal)
        }
    }

    /**
     * Écoute des soumissions de modales
     */
    async listen() {
        this.client.on('interactionCreate',
            /**
             * @param interaction The interaction which was created
             */
            async (interaction: BaseInteraction) => {
                if(!interaction.isModalSubmit()) return

                const modal = this.modals.get(interaction.customId)

                if(!modal) return

                try {
                    await modal.execute(interaction)
                } catch(error) {
                    let errMessage: string
                    if(error.name === 'MODAL_ERROR') {
                        errMessage = error.message
                    } else {
                        errMessage = Locales.get(interaction.locale, 'modal_error')
                        Logger.log('ModalManager', 'ERROR', `La soumission de la modale "${interaction.customId}" a échouée : ${error.message}`)
                    }

                    const embed = new EmbedBuilder()
                            .setColor('#E74C3C')
                            .setDescription(`❌ ${errMessage}`)

                    if(!interaction.deferred && !interaction.replied) {
                        await interaction.reply({ embeds: [embed], ephemeral: true })
                    } else {
                        await interaction.editReply({ embeds: [embed] })
                    }
                }
            }
        )
    }
}