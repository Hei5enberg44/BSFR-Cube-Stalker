import * as fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    Client,
    Guild,
    Collection,
    ApplicationCommand,
    CommandInteractionOption,
    BaseInteraction,
    ApplicationCommandOptionType,
    channelMention,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} from 'discord.js'
import { CommandError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

interface Command extends ApplicationCommand {
    allowedChannels?: string[]
    execute: Function
}

const __dirname = dirname(fileURLToPath(import.meta.url))

export default class Commands {
    client: Client
    commands: Collection<string, ApplicationCommand> = new Collection()

    constructor(client: Client) {
        this.client = client
    }

    /**
     * Récupération des options d'une commande exécutée
     * @param options données de la commande exécutée
     * @returns liste des options de la commande exécutée
     */
    getCommandOptions(options: readonly CommandInteractionOption[]): string[] {
        return options.flatMap((d) => {
            switch (d.type) {
                case ApplicationCommandOptionType.Attachment:
                    return `${d.name}:${d?.attachment?.name}`
                case ApplicationCommandOptionType.Subcommand: {
                    const subCommandName = d.name
                    let commandOptions = [subCommandName]
                    if (d.options)
                        commandOptions = [
                            ...commandOptions,
                            ...this.getCommandOptions(d.options)
                        ]
                    return commandOptions
                }
                case ApplicationCommandOptionType.SubcommandGroup: {
                    const subCommandGroupName = d.name
                    let commandOptions = [subCommandGroupName]
                    if (d.options)
                        commandOptions = [
                            ...commandOptions,
                            ...this.getCommandOptions(d.options)
                        ]
                    return commandOptions
                }
                default:
                    return `${d.name}:${d?.value}`
            }
        })
    }

    /**
     * Chargement des commandes au démarrage du Bot
     */
    async load() {
        const commands = [] // Liste des commandes
        const commandFiles = fs
            .readdirSync(resolve(__dirname, '../commands'))
            .filter((file) => file.endsWith('.js'))

        // On récupère les commandes
        for (const file of commandFiles) {
            const { default: command } = await import(`../commands/${file}`)
            commands.push(command.data)
            Logger.log(
                'CommandManager',
                'INFO',
                `Commande "/${command.data.name}" trouvée`
            )
            this.commands.set(command.data.name, command)
        }

        // On ajoute chaque commande au serveur
        Logger.log(
            'CommandManager',
            'INFO',
            `Actualisation des commandes (/) de l'application`
        )
        const guild = <Guild>this.client.guilds.cache.get(config.guild.id)
        await guild.commands.set(commands)
        Logger.log(
            'CommandManager',
            'INFO',
            "Fin de l'actualisation des commandes (/) de l'application"
        )
    }

    /**
     * Écoute des saisies de commandes
     */
    async listen() {
        this.client.on(
            'interactionCreate',
            /**
             * @param interaction The interaction which was created
             */
            async (interaction: BaseInteraction) => {
                if (!interaction.isChatInputCommand()) return

                const command = <Command>(
                    this.commands.get(interaction.commandName)
                )

                if (!command) return

                try {
                    const commandOptions = this.getCommandOptions(
                        interaction.options.data
                    )
                    Logger.log(
                        'CommandManager',
                        'INFO',
                        `${interaction.user.tag} a exécuté la commande "/${interaction.commandName}${commandOptions.length > 0 ? ` ${commandOptions.join(' ')}` : ''}"`
                    )

                    // On test si la commande est exécutée depuis le bon channel
                    if (command.allowedChannels) {
                        for (const channel of command.allowedChannels) {
                            if (channel !== interaction.channelId) {
                                throw new CommandError(
                                    Locales.get(
                                        interaction.locale,
                                        'wrong_channel',
                                        command.allowedChannels
                                            .map((channel) =>
                                                channelMention(channel)
                                            )
                                            .join('\n')
                                    ),
                                    interaction.commandName
                                )
                            }
                        }
                    }

                    if (command.execute) await command.execute(interaction)
                } catch (error) {
                    let errMessage: string
                    if (error.name === 'COMMAND_ERROR') {
                        errMessage = error.message
                    } else {
                        errMessage = Locales.get(
                            interaction.locale,
                            'command_error'
                        )
                        Logger.log(
                            'CommandManager',
                            'ERROR',
                            `L'exécution de la commande "/${interaction.commandName}" a échoué : ${error.message}`
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
