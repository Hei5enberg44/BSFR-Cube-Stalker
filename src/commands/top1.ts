import {
    Guild,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ApplicationCommand,
    chatInputApplicationCommandMention,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} from 'discord.js'
import { CommandError, CommandInteractionError, Top1Error } from '../utils/error.js'
import players from '../controllers/players.js'
import top1 from '../controllers/top1.js'
import { Leaderboards } from '../controllers/gameLeaderboard.js'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('top1')
        .setDescription('S\'inscrire ou se désinscrire du top 1 pays')
        .addBooleanOption(option =>
            option.setName('subscribe')
                .setDescription('True: s\'inscrire au top 1 pays, False: se désinscrire du top 1 pays')
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    ,
    allowedChannels: [
        config.guild.channels['cube-stalker']
    ],

    /**
     * Exécution de la commande
     * @param interaction intéraction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const subscribe = interaction.options.getBoolean('subscribe', true)

            const guild = <Guild>interaction.guild

            // Identifiant du membre exécutant la commande
            const memberId = interaction.user.id

            // Informations sur le membre
            const member = await players.get(memberId, Leaderboards.ScoreSaber)
            
            // On vérifie ici si le membre a lié son compte ScoreSaber ou non
            if(!member) {
                const linkCommand = <ApplicationCommand>guild.commands.cache.find(c => c.name === 'link')
                throw new CommandInteractionError(`Aucun profil ScoreSaber n'est lié avec votre compte Discord\nℹ️ Utilisez la commande ${chatInputApplicationCommandMention(linkCommand.name, linkCommand.id)} afin de lier celui-ci`)
            }

            const isSubscribed = member.top1

            // Si le membre est déjà inscrit au top 1 pays
            if(isSubscribed === subscribe && subscribe === true)
                throw new Top1Error('Vous êtes déjà inscrit au top 1 pays')

            // Si le membre est déjà désinscrit du top 1 pays
            if(isSubscribed === subscribe && subscribe === false)
                throw new Top1Error('Vous êtes déjà désinscrit du top 1 pays')

            let message = ''
            if(isSubscribed) {
                await top1.subscribe(memberId, false)
                Logger.log('Top1', 'INFO', `${interaction.user.tag} est maintenant désinscrit du top 1 pays`)
                message = 'Vous êtes maintenant désinscrit du top 1 pays'
            } else {
                await top1.subscribe(memberId, true)
                Logger.log('Top1', 'INFO', `${interaction.user.tag} est maintenant sinscrit au top 1 pays`)
                message = 'Vous êtes maintenant inscrit au top 1 pays'
            }

            const containerBuilder = new ContainerBuilder()
                .setAccentColor([ 46, 204, 113 ])
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`✅ ${message}`)
                )

            await interaction.reply({
                flags: [
                    MessageFlags.IsComponentsV2,
                    MessageFlags.Ephemeral
                ],
                components: [ containerBuilder ]
            })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'TOP1_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}