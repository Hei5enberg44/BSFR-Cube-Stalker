import { Guild, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, chatInputApplicationCommandMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche l\'aide')
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

            const commandsList = [ 'link', 'unlink', 'me', 'ld', 'locateworld', 'world', 'top1', 'playlist' ]

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
            }).join('\n')

            const embed = new Embed()
                .setColor('#000000')
                .setTitle('Aide')
                .addFields({ name: 'Liste des commandes', value: help})
            
            await interaction.reply({ embeds: [ embed ], ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}