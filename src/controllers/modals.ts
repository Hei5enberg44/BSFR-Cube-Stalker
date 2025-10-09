import * as fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    Client,
    Collection,
    BaseInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
    ComponentType
} from 'discord.js'
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
        const modalFiles = fs
            .readdirSync(resolve(__dirname, '../modals'))
            .filter((file) => file.endsWith('.js'))

        // On récupère les modales
        for (const file of modalFiles) {
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
        this.client.on(
            'interactionCreate',
            /**
             * @param interaction The interaction which was created
             */
            async (interaction: BaseInteraction) => {
                if (!interaction.isModalSubmit()) return

                const modal = this.modals.get(interaction.customId)

                if (!modal) return

                try {
                    // Log des champs saisis dans la modale
                    const modalForm: Record<
                        string,
                        string | string[] | Record<string, string[]> | undefined
                    > = {}
                    const fields = interaction.fields.fields
                    for (const [fieldName, fieldData] of fields) {
                        switch (fieldData.type) {
                            case ComponentType.TextInput:
                                modalForm[fieldName] = fieldData.value
                                break
                            case ComponentType.RoleSelect:
                                modalForm[fieldName] =
                                    fieldData.roles && fieldData.roles.size > 0
                                        ? fieldData.roles
                                              .entries()
                                              .map(([roleId]) => roleId)
                                              .toArray()
                                        : []
                                break
                            case ComponentType.UserSelect:
                                modalForm[fieldName] =
                                    fieldData.users && fieldData.users.size > 0
                                        ? fieldData.users
                                              .entries()
                                              .map(([userId]) => userId)
                                              .toArray()
                                        : []
                                break
                            case ComponentType.StringSelect:
                                modalForm[fieldName] = fieldData.values.map(
                                    (s) => s
                                )
                                break
                            case ComponentType.ChannelSelect:
                                modalForm[fieldName] =
                                    fieldData.channels &&
                                    fieldData.channels.size > 0
                                        ? fieldData.channels
                                              .entries()
                                              .map(([channelId]) => channelId)
                                              .toArray()
                                        : []
                                break
                            case ComponentType.MentionableSelect:
                                modalForm[fieldName] = {
                                    channels: [],
                                    members: [],
                                    roles: [],
                                    users: []
                                }
                                if (
                                    fieldData.channels &&
                                    fieldData.channels.size > 0
                                )
                                    modalForm[fieldName].channels =
                                        fieldData.channels
                                            .entries()
                                            .map(([channelId]) => channelId)
                                            .toArray()
                                if (
                                    fieldData.members &&
                                    fieldData.members.size > 0
                                )
                                    modalForm[fieldName].members =
                                        fieldData.members
                                            .entries()
                                            .map(([memberId]) => memberId)
                                            .toArray()
                                if (fieldData.roles && fieldData.roles.size > 0)
                                    modalForm[fieldName].roles = fieldData.roles
                                        .entries()
                                        .map(([roleId]) => roleId)
                                        .toArray()
                                if (fieldData.users && fieldData.users.size > 0)
                                    modalForm[fieldName].users = fieldData.users
                                        .entries()
                                        .map(([userId]) => userId)
                                        .toArray()
                                break
                            default:
                                modalForm[fieldName] = undefined
                        }
                    }
                    Logger.log(
                        'ModalManager',
                        'INFO',
                        `Soumission de la modale "${interaction.customId}" (${JSON.stringify(modalForm)})`
                    )

                    // Soumission de la modale
                    await modal.execute(interaction)
                } catch (error) {
                    let errMessage: string
                    if (error.name === 'MODAL_ERROR') {
                        errMessage = error.message
                    } else {
                        errMessage = Locales.get(
                            interaction.locale,
                            'modal_error'
                        )
                        Logger.log(
                            'ModalManager',
                            'ERROR',
                            `La soumission de la modale "${interaction.customId}" a échouée : ${error.message}`
                        )
                    }

                    const containerBuilder = new ContainerBuilder()
                        .setAccentColor([231, 76, 60])
                        .addTextDisplayComponents([
                            new TextDisplayBuilder().setContent(
                                `❌ ${errMessage}`
                            )
                        ])

                    if (!interaction.deferred && !interaction.replied) {
                        await interaction.reply({
                            flags: [MessageFlags.IsComponentsV2],
                            components: [containerBuilder],
                            embeds: []
                        })
                    } else {
                        await interaction.editReply({
                            flags: [MessageFlags.IsComponentsV2],
                            components: [containerBuilder],
                            embeds: []
                        })
                    }
                }
            }
        )
    }
}
