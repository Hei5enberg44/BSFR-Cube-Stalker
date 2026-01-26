import {
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle
} from 'discord.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import { CommandError } from '../utils/error.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription(
            'Lie votre profil ScoreSaber ou BeatLeader à votre compte Discord'
        )
        .addStringOption((option) =>
            option
                .setName('leaderboard')
                .setDescription('Choix du leaderboard')
                .setChoices(
                    { name: 'ScoreSaber', value: Leaderboards.ScoreSaber },
                    { name: 'BeatLeader', value: Leaderboards.BeatLeader },
                    { name: 'AccSaber', value: Leaderboards.AccSaber }
                )
                .setRequired(true)
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
            const leaderboardChoice = interaction.options.getString(
                'leaderboard',
                true
            ) as Leaderboards

            const modal = new ModalBuilder()
                .setCustomId(`link${leaderboardChoice}Profile`)
                .setTitle(`Lier un profil ${leaderboardChoice}`)

            const profilUrlInput = new TextInputBuilder()
                .setCustomId('url')
                .setLabel('Lien du profil')
                .setPlaceholder(
                    `https://${leaderboardChoice.toLowerCase()}.com/${leaderboardChoice === Leaderboards.AccSaber ? 'profile' : 'u'}/76561199100396335`
                )
                .setMinLength(25)
                .setMaxLength(100)
                .setStyle(TextInputStyle.Short)
                .setRequired(true)

            const actionRow =
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    profilUrlInput
                )
            modal.addComponents(actionRow)

            await interaction.showModal(modal)
        } catch (error) {
            if (error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
