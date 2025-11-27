import {
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    chatInputApplicationCommandMention,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    ComponentType,
    Message,
    bold
} from 'discord.js'
import Locales from '../utils/locales.js'
import {
    CommandError,
    CommandInteractionError,
    PageNotFoundError
} from '../utils/error.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("Affiche l'aide")
        .addIntegerOption((option) =>
            option
                .setName('page')
                .setDescription('Page à afficher')
                .setMinValue(1)
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    allowedChannels: [config.guild.channels['cube-stalker']],

    /**
     * Exécution de la commande
     * @param interaction intéraction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const applicationCommands =
                interaction.client.application.commands.cache

            const commandsList = [
                'link',
                'unlink',
                'me',
                'ld',
                'locateworld',
                'world',
                'top1',
                'playlist',
                'clan'
            ]

            const getHelp = (
                page: number,
                itemsPerPage: number,
                pageCount: number
            ) => {
                try {
                    if (page > pageCount) throw new PageNotFoundError()

                    const help = commandsList
                        .flatMap((cn) => {
                            const command = applicationCommands.find(
                                (c) => c.name === cn
                            )
                            if (command) {
                                const commandsHelp = []
                                const subCommands = command.options.filter(
                                    (o) => o.type === 1
                                )
                                if (subCommands.length > 0) {
                                    for (const subCommand of subCommands) {
                                        commandsHelp.push(
                                            `${chatInputApplicationCommandMention(command.name, subCommand.name, command.id)}: ${subCommand.description}`
                                        )
                                    }
                                } else {
                                    commandsHelp.push(
                                        `${chatInputApplicationCommandMention(command.name, command.id)}: ${command.description}`
                                    )
                                }
                                return commandsHelp
                            }
                            return `/${cn}: Pas de description pour cette commande`
                        })
                        .slice(
                            (page - 1) * itemsPerPage,
                            (page - 1) * itemsPerPage + itemsPerPage
                        )
                        .join('\n')

                    const containerBuilder = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('### Aide')
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(true)
                                .setSpacing(SeparatorSpacingSize.Large)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                bold('Liste des commandes :')
                            ),
                            new TextDisplayBuilder().setContent(help)
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(true)
                                .setSpacing(SeparatorSpacingSize.Large)
                        )
                        .addActionRowComponents(
                            new ActionRowBuilder<ButtonBuilder>().setComponents(
                                new ButtonBuilder()
                                    .setCustomId('help_btn_prev')
                                    .setLabel(
                                        Locales.get(
                                            interaction.locale,
                                            'previous'
                                        )
                                    )
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(page === 1),
                                new ButtonBuilder()
                                    .setCustomId('help_btn_next')
                                    .setLabel(
                                        Locales.get(interaction.locale, 'next')
                                    )
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(page === pageCount)
                            )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(false)
                                .setSpacing(SeparatorSpacingSize.Small)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `-# Page ${Locales.get(interaction.locale, 'page_info', page, pageCount)}`
                            )
                        )

                    return containerBuilder
                } catch (error) {
                    if (error.name === 'PAGE_NOT_FOUND_ERROR')
                        throw new CommandInteractionError(
                            Locales.get(interaction.locale, 'page_not_found')
                        )
                    else throw error
                }
            }

            let page = interaction.options.getInteger('page') ?? 1
            const itemsPerPage = 6
            const pageCount = Math.ceil(commandsList.length / itemsPerPage)

            const helpContainerBuilder = getHelp(page, itemsPerPage, pageCount)
            const response = await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [helpContainerBuilder],
                withResponse: true
            })

            const collectorFilter = (i: ButtonInteraction) =>
                i.user.id === interaction.user.id

            const message = response.resource?.message as Message
            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: collectorFilter,
                time: 900_000
            })

            collector.on('collect', async (i) => {
                collector.resetTimer()

                if (i.customId === 'help_btn_prev') page--
                if (i.customId === 'help_btn_next') page++

                const helpContainerBuilder = getHelp(
                    page,
                    itemsPerPage,
                    pageCount
                )
                await i.update({ components: [helpContainerBuilder] })
            })
        } catch (error) {
            if (error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
