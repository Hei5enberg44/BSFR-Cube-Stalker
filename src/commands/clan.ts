import {
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    hyperlink,
    MessageFlags
} from 'discord.js'
import players from '../controllers/players.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import { BeatLeaderOAuth } from '../controllers/beatleader-oauth.js'
import { CommandError } from '../utils/error.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('clan')
        .setDescription('Gestion du clan BeatLeader')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('invitation')
                .setDescription(
                    'Permet de recevoir une invitation pour rejoindre le clan BSFR'
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

            switch (action) {
                case 'invitation': {
                    const player = await players.get(
                        interaction.user.id,
                        Leaderboards.BeatLeader
                    )
                    if (player) {
                        await interaction.deferReply({
                            flags: MessageFlags.Ephemeral
                        })
                        await BeatLeaderOAuth.sendClanInvitation(
                            player.playerId
                        )
                        Logger.log(
                            'BeatLeaderOAuth',
                            'INFO',
                            `Une invitation à rejoindre le clan BSFR a été envoyée au joueur « ${player.playerName} »`
                        )

                        const containerComponent = new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    '### ✅ Invitation envoyée !'
                                )
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                    .setDivider(true)
                                    .setSpacing(SeparatorSpacingSize.Small)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `${hyperlink('Cliquez ici', 'https://beatleader.com/clans')} pour accepter l'invitation.`
                                )
                            )

                        await interaction.editReply({
                            flags: [
                                MessageFlags.IsComponentsV2,
                                MessageFlags.SuppressEmbeds
                            ],
                            components: [containerComponent]
                        })
                    } else {
                        const modal = new ModalBuilder()
                            .setCustomId('blClanInvite')
                            .setTitle('Rrejoindre le clan BSFR')

                        const profilUrlInput = new TextInputBuilder()
                            .setCustomId('url')
                            .setLabel('Lien du profil')
                            .setPlaceholder(
                                'https://beatleader.com/u/76561199233450694'
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
                    }
                }
            }
        } catch (error) {
            if (
                error.name === 'COMMAND_INTERACTION_ERROR' ||
                error.name === 'BEATLEADER_ERROR' ||
                error.name === 'PLAYER_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
