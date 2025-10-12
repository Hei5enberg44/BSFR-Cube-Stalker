import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    Message,
    ComponentType
} from 'discord.js'
import {
    CommandError,
    CommandInteractionError,
    PageNotFoundError
} from '../utils/error.js'
import leaderboard from '../controllers/leaderboard.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import Locales from '../utils/locales.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('ld')
        .setDescription('Affiche le classement du serveur')
        .addStringOption((option) =>
            option
                .setName('classement')
                .setDescription('Type de classement à afficher')
                .setChoices(
                    { name: 'Points de performance', value: 'pp' },
                    { name: 'Précision', value: 'acc' }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
                )
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('page')
                .setDescription('Page à afficher')
                .setMinValue(1)
                .setRequired(false)
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
            const guild = interaction.guild as Guild

            const getLeaderboard = async (
                page: number,
                itemsPerPage: number
            ) => {
                try {
                    const ld = await leaderboard.getLeaderboard(
                        leaderboardChoice,
                        classement,
                        page,
                        itemsPerPage
                    )

                    if (page > ld.pageCount) throw new PageNotFoundError()

                    const containerBuilder = new ContainerBuilder()
                        .setAccentColor(
                            leaderboardChoice === Leaderboards.ScoreSaber
                                ? [255, 222, 24]
                                : leaderboardChoice === Leaderboards.BeatLeader
                                  ? [217, 16, 65]
                                  : undefined
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### ${ldIcon ? `<:${ldIconName}:${ldIconId}> ` : ''} Classement ${classement === 'pp' ? 'PP' : 'Précision'} Serveur`
                            )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(true)
                                .setSpacing(SeparatorSpacingSize.Large)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(ld.content)
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(true)
                                .setSpacing(SeparatorSpacingSize.Large)
                        )
                        .addActionRowComponents(
                            new ActionRowBuilder<ButtonBuilder>().setComponents(
                                new ButtonBuilder()
                                    .setCustomId('ld_btn_prev')
                                    .setLabel(
                                        Locales.get(
                                            interaction.locale,
                                            'previous'
                                        )
                                    )
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(page === 1),
                                new ButtonBuilder()
                                    .setCustomId('ld_btn_next')
                                    .setLabel(
                                        Locales.get(interaction.locale, 'next')
                                    )
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(page === ld.pageCount)
                            )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(false)
                                .setSpacing(SeparatorSpacingSize.Small)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `-# Page ${Locales.get(interaction.locale, 'page_info', page, ld.pageCount)}`
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

            // Paramètres de la commande
            const leaderboardChoice =
                (interaction.options.getString(
                    'leaderboard'
                ) as Leaderboards) ?? Leaderboards.ScoreSaber
            const classement = interaction.options.getString('classement', true)
            let page = interaction.options.getInteger('page') ?? 1

            const itemsPerPage = 10

            // Icône Leaderboard
            const ldIconName =
                leaderboardChoice === Leaderboards.ScoreSaber
                    ? 'ss'
                    : leaderboardChoice === Leaderboards.BeatLeader
                      ? 'bl'
                      : ''
            const ldIcon = guild.emojis.cache.find((e) => e.name === ldIconName)
            const ldIconId = ldIcon?.id

            const response = await interaction.deferReply({
                flags: MessageFlags.Ephemeral,
                withResponse: true
            })
            const ldContainerBuilder = await getLeaderboard(page, itemsPerPage)
            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [ldContainerBuilder]
            })

            const collectorFilter = (i: ButtonInteraction) =>
                i.user.id === interaction.user.id

            const messageResource = response.resource?.message as Message
            const collector = messageResource.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: collectorFilter,
                time: 900_000
            })

            collector.on('collect', async (i) => {
                collector.resetTimer()

                if (i.customId === 'ld_btn_prev') page--
                if (i.customId === 'ld_btn_next') page++

                const ldContainerBuilder = await getLeaderboard(
                    page,
                    itemsPerPage
                )
                await i.update({ components: [ldContainerBuilder] })
            })
        } catch (error) {
            if (
                error.name === 'COMMAND_INTERACTION_ERROR' ||
                error.name === 'SCORESABER_ERROR' ||
                error.name === 'BEATLEADER_ERROR' ||
                error.name === 'LEADERBOARD_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
