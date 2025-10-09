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
import { CommandError } from '../utils/error.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

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
                    { name: 'ScoreSaber', value: 'scoresaber' },
                    { name: 'BeatLeader', value: 'beatleader' }
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
                .setCustomId(
                    leaderboardChoice === 'scoresaber'
                        ? 'linkScoreSaberProfile'
                        : 'linkBeatLeaderProfile'
                )
                .setTitle(
                    `Lier un profil ${leaderboardChoice === 'scoresaber' ? 'ScoreSaber' : 'BeatLeader'}`
                )

            const profilUrlInput = new TextInputBuilder()
                .setCustomId('url')
                .setLabel('Lien du profil')
                .setPlaceholder(
                    leaderboardChoice === 'scoresaber'
                        ? 'https://scoresaber.com/u/76561198796531407'
                        : 'https://beatleader.com/u/76561199233450694'
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
