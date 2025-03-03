import { Guild, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, chatInputApplicationCommandMention } from 'discord.js'
import Embed from '../utils/embed.js'
import Locales from '../utils/locales.js'
import { CommandError, CommandInteractionError, PageNotFoundError } from '../utils/error.js'
import config from '../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche l\'aide')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page à afficher')
                .setMinValue(1)
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
            const guild = <Guild>interaction.guild

            const commandsList = [ 'link', 'unlink', 'me', 'ld', 'locateworld', 'world', 'top1', 'playlist', 'clan' ]

            const page = interaction.options.getInteger('page') ?? 1
            const itemsPerPage = 6
            const pageCount = Math.ceil(commandsList.length / itemsPerPage)

            try {
                if(page > pageCount) throw new PageNotFoundError()

                const help = commandsList.flatMap(cn => {
                    const command = guild.commands.cache.find(c => c.name === cn)
                    if(command) {
                        const commandsHelp = []
                        const subCommands = command.options.filter(o => o.type === 1)
                        if(subCommands.length > 0) {
                            for(const subCommand of subCommands) {
                                commandsHelp.push(`${chatInputApplicationCommandMention(command.name, subCommand.name, command.id)}: ${subCommand.description}`)
                            }
                        } else {
                            commandsHelp.push(`${chatInputApplicationCommandMention(command.name, command.id)}: ${command.description}`)
                        }
                        return commandsHelp
                    }
                    return `/${cn}: Pas de description pour cette commande`
                }).slice((page - 1) * itemsPerPage, (page - 1) * itemsPerPage + itemsPerPage).join('\n')

                const embed = new Embed()
                    .setColor('#000000')
                    .setTitle('Aide')
                    .addFields(
                        { name: 'Liste des commandes', value: help},
                        { name: 'Page', value: Locales.get(interaction.locale, 'page_info', page, pageCount) }
                    )
                
                await interaction.reply({ embeds: [ embed ], ephemeral: true })
            } catch(error) {
                if(error.name === 'PAGE_NOT_FOUND_ERROR')
                    throw new CommandInteractionError(Locales.get(interaction.locale, 'page_not_found'))
                else
                    throw error
            }
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}