import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    GuildMember,
    GuildMemberRoleManager,
    time,
    TimestampStyles,
    userMention,
    Message,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import cooldown from '../controllers/cooldown.js'
import players from '../controllers/players.js'
import roles from '../controllers/roles.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription(
            "Délie le profil ScoreSaber ou BeatLeader d'un membre Discord"
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
        .addUserOption((option) =>
            option
                .setName('joueur')
                .setDescription('Joueur à délier')
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
            const memberRoles = (<GuildMemberRoleManager>(
                interaction.member?.roles
            )).cache
            const isAdmin =
                memberRoles.find(
                    (role) => ['Admin', 'Modérateur'].indexOf(role.name) !== -1
                ) !== undefined

            const leaderboardChoice = interaction.options.getString(
                'leaderboard'
            ) as Leaderboards
            const member =
                interaction.options.getUser('joueur') ?? interaction.user

            const guild = <Guild>interaction.guild

            // Si le membre n'a pas le rôle Admin ou Modérateur et essaye d'exécuter la commande sur un autre membre
            if (!isAdmin && member.id !== interaction.user.id)
                throw new CommandInteractionError(
                    "Vous n'êtes pas autorisé à délier le profil ScoreSaber ou BeatLeader d'un autre membre que vous"
                )

            const memberToUnlink = await players.get(
                member.id,
                leaderboardChoice
            )
            if (!memberToUnlink)
                throw new CommandInteractionError(
                    `Il n'y a pas de profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatSaber'} lié au membre ${userMention(member.id)}`
                )

            // Si le membre qui exécute la commande n'a pas le rôle Admin ou Modérateur, on lui ajoute un cooldown pour cette commande
            const cd = isAdmin
                ? null
                : await cooldown.checkCooldown(
                      `unlink_${leaderboardChoice === Leaderboards.ScoreSaber ? 'ss' : 'bl'}`,
                      interaction.user.id,
                      60 * 60 * 24 * 30
                  )

            // On demande confirmation pour exécuter la commande
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
                        `### Délier un profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        member.id === interaction.user.id
                            ? `⚠️ Êtes-vous sûr(e) de vouloir délier votre profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatSaber'} ?`
                            : `⚠️ Êtes-vous sûr(e) de vouloir délier le profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatSaber'} pour le membre ${userMention(member.id)} ?`
                    )
                )

            if (cd) {
                containerBuilder.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Vous pourrez exécuter cette commande de nouveau \`${time(cd, TimestampStyles.RelativeTime)}\``
                    )
                )
            }

            containerBuilder
                .addSeparatorComponents(
                    new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(SeparatorSpacingSize.Large)
                )
                .addActionRowComponents(
                    new ActionRowBuilder<ButtonBuilder>().setComponents(
                        new ButtonBuilder()
                            .setCustomId('unlink_btn_confirm')
                            .setLabel('Je suis sûr(e)')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('unlink_btn_cancel')
                            .setLabel('Annuler')
                            .setStyle(ButtonStyle.Secondary)
                    )
                )

            const confirmMessage = await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [containerBuilder],
                withResponse: true
            })
            const confirmMessageResource = confirmMessage.resource
                ?.message as Message<boolean>

            const collectorFilter = (i: any) =>
                i.user.id === interaction.user.id

            try {
                const confirmation =
                    await confirmMessageResource.awaitMessageComponent({
                        filter: collectorFilter,
                        time: 30_000
                    })
                if (confirmation.customId === 'unlink_btn_confirm') {
                    // On ajoute le cooldown si le membre exécutant la commande n'a pas le rôle Admin ou Modérateur
                    if (cd)
                        await cooldown.addCooldown(
                            `unlink_${leaderboardChoice === Leaderboards.ScoreSaber ? 'ss' : 'bl'}`,
                            interaction.user.id,
                            cd
                        )

                    // On délie le profil ScoreSaber ou BeatLeader du membre
                    await players.remove(member.id, leaderboardChoice)

                    // On supprime les rôles pp du membre
                    const memberToUpdate = <GuildMember>(
                        guild.members.cache.find((m) => m.id === member.id)
                    )
                    await roles.updateMemberPpRoles(
                        leaderboardChoice,
                        memberToUpdate,
                        0
                    )

                    const containerBuilder = new ContainerBuilder()
                        .setAccentColor([46, 204, 113])
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### Délier un profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}`
                            )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(true)
                                .setSpacing(SeparatorSpacingSize.Large)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `✅ Le profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatSaber'} a bien été délié du compte ${userMention(member.id)}`
                            )
                        )

                    if (cd) {
                        containerBuilder.addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `Vous pourrez exécuter cette commande de nouveau \`${time(cd, TimestampStyles.RelativeTime)}\``
                            )
                        )
                    }

                    await confirmation.update({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [containerBuilder]
                    })
                } else if (confirmation.customId === 'unlink_btn_cancel') {
                    const containerBuilder = new ContainerBuilder()
                        .setAccentColor([231, 76, 60])
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `### Délier un profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}`
                            )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder()
                                .setDivider(true)
                                .setSpacing(SeparatorSpacingSize.Large)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                "❌ L'opération a été annulée"
                            )
                        )

                    await confirmation.update({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [containerBuilder]
                    })
                }
            } catch {
                const containerBuilder = new ContainerBuilder()
                    .setAccentColor([231, 76, 60])
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `### Délier un profil ${leaderboardChoice === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}`
                        )
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                            .setDivider(true)
                            .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '❌ Vous avez mis trop de temps à répondre'
                        )
                    )

                await interaction.editReply({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [containerBuilder]
                })
            }
        } catch (error) {
            if (
                error.name === 'COMMAND_INTERACTION_ERROR' ||
                error.name === 'COOLDOWN_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
