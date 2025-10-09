import {
    InteractionContextType,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    AttachmentBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    FileBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    LabelBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserSelectMenuBuilder
} from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import playlist from '../controllers/playlist.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Génère une playlist de maps')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('played')
                .setDescription(
                    'Génénérer une playlist à partir de vos maps jouées'
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('ranked')
                .setDescription(
                    'Génénérer une playlist à partir des maps ranked'
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('snipe')
                .setDescription(
                    "Génénérer une playlist de maps à sniper par rapport aux scores d'un autre joueur"
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('clan-wars')
                .setDescription(
                    'Génénérer une playlist de maps à capturer pour la guerre de clans BeatLeader'
                )
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
            const action = interaction.options.getSubcommand(true)

            const mapStarsSelectMenuOptions: StringSelectMenuOptionBuilder[] =
                []
            for (let i = 0; i <= 20; i++) {
                mapStarsSelectMenuOptions.push(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(i.toString())
                        .setValue(i.toString())
                        .setEmoji('⭐')
                )
            }

            switch (action) {
                case 'played': {
                    const modal = new ModalBuilder()
                        .setCustomId('playlistPlayed')
                        .setTitle('Générer une playlist de maps jouées')

                    const leaderboardChoiceLabel = new LabelBuilder()
                        .setLabel('Leaderboard')
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId('leaderboard')
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('ScoreSaber')
                                        .setValue(Leaderboards.ScoreSaber)
                                        .setDefault(true),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('BeatLeader')
                                        .setValue(Leaderboards.BeatLeader)
                                )
                                .setRequired(true)
                        )

                    const minStarsLabel = new LabelBuilder()
                        .setLabel("Nombre d'étoiles minimum")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId('min_stars')
                                .setPlaceholder("Le minimum d'étoiles")
                                .addOptions(mapStarsSelectMenuOptions)
                                .setMinValues(0)
                                .setRequired(false)
                        )

                    const maxStarsLabel = new LabelBuilder()
                        .setLabel("Nombre d'étoiles maximum")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId('max_stars')
                                .setPlaceholder("Le maximum d'étoiles")
                                .addOptions(mapStarsSelectMenuOptions)
                                .setMinValues(0)
                                .setRequired(false)
                        )

                    const minAccLabel = new LabelBuilder()
                        .setLabel("Pourcentage d'accuracy minimum")
                        .setTextInputComponent(
                            new TextInputBuilder()
                                .setStyle(TextInputStyle.Short)
                                .setCustomId('min_acc')
                                .setPlaceholder('80')
                                .setRequired(false)
                        )

                    const maxAccLabel = new LabelBuilder()
                        .setLabel("Pourcentage d'accuracy maximum")
                        .setTextInputComponent(
                            new TextInputBuilder()
                                .setStyle(TextInputStyle.Short)
                                .setCustomId('max_acc')
                                .setPlaceholder('96.5')
                                .setRequired(false)
                        )

                    modal.addLabelComponents(
                        leaderboardChoiceLabel,
                        minStarsLabel,
                        maxStarsLabel,
                        minAccLabel,
                        maxAccLabel
                    )

                    await interaction.showModal(modal)

                    break
                }
                case 'ranked': {
                    const modal = new ModalBuilder()
                        .setCustomId('playlistRanked')
                        .setTitle('Générer une playlist de maps ranked')

                    const leaderboardChoiceLabel = new LabelBuilder()
                        .setLabel('Leaderboard')
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId('leaderboard')
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('ScoreSaber')
                                        .setValue(Leaderboards.ScoreSaber)
                                        .setDefault(true),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('BeatLeader')
                                        .setValue(Leaderboards.BeatLeader)
                                )
                                .setRequired(true)
                        )

                    const minStarsLabel = new LabelBuilder()
                        .setLabel("Nombre d'étoiles minimum")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId('min_stars')
                                .setPlaceholder("Le minimum d'étoiles")
                                .addOptions(mapStarsSelectMenuOptions)
                                .setMinValues(0)
                                .setRequired(false)
                        )

                    const maxStarsLabel = new LabelBuilder()
                        .setLabel("Nombre d'étoiles maximum")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId('max_stars')
                                .setPlaceholder("Le maximum d'étoiles")
                                .addOptions(mapStarsSelectMenuOptions)
                                .setMinValues(0)
                                .setRequired(false)
                        )

                    modal.addLabelComponents(
                        leaderboardChoiceLabel,
                        minStarsLabel,
                        maxStarsLabel
                    )

                    await interaction.showModal(modal)

                    break
                }
                case 'snipe': {
                    const modal = new ModalBuilder()
                        .setCustomId('playlistSnipe')
                        .setTitle('Générer une playlist pour sniper un joueur')

                    const leaderboardChoiceLabel = new LabelBuilder()
                        .setLabel('Leaderboard')
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId('leaderboard')
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('ScoreSaber')
                                        .setValue(Leaderboards.ScoreSaber)
                                        .setDefault(true),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('BeatLeader')
                                        .setValue(Leaderboards.BeatLeader)
                                )
                                .setRequired(true)
                        )

                    const playerLabel = new LabelBuilder()
                        .setLabel('Joueur à sniper')
                        .setUserSelectMenuComponent(
                            new UserSelectMenuBuilder()
                                .setCustomId('player')
                                .setRequired(true)
                        )

                    modal.addLabelComponents(
                        leaderboardChoiceLabel,
                        playerLabel
                    )

                    await interaction.showModal(modal)

                    break
                }
                case 'clan-wars': {
                    const containerBuilder = new ContainerBuilder()
                        .setAccentColor([241, 196, 15])
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                '### 🛠️ Génération de la playlist en cours...'
                            )
                        )

                    await interaction.editReply({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [containerBuilder]
                    })

                    // Génération de la playlist
                    try {
                        const playlistData = await playlist.getClan()

                        const attachment = new AttachmentBuilder(
                            Buffer.from(JSON.stringify(playlistData)),
                            { name: `${playlistData.fileName}.json` }
                        )

                        const containerBuilder = new ContainerBuilder()
                            .setAccentColor([217, 16, 65])
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '### Ta playlist est prête !'
                                )
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                    .setDivider(true)
                                    .setSpacing(SeparatorSpacingSize.Large)
                            )
                            .addFileComponents(
                                new FileBuilder().setURL(
                                    `attachment://${attachment.name}`
                                )
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                    .setDivider(false)
                                    .setSpacing(SeparatorSpacingSize.Small)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `-# ${playlistData.songs.length} maps`
                                )
                            )

                        await interaction.editReply({
                            flags: [MessageFlags.IsComponentsV2],
                            components: [containerBuilder],
                            files: [attachment]
                        })
                    } catch (error) {
                        if (error.name === 'PLAYLIST_ERROR')
                            throw new CommandInteractionError(error.message)
                    }

                    break
                }
            }
        } catch (error) {
            if (
                error.name === 'COMMAND_INTERACTION_ERROR' ||
                error.name === 'SCORESABER_ERROR' ||
                error.name === 'BEATLEADER_ERROR' ||
                error.name === 'BEATSAVER_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
