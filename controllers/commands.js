import { Client, Collection, EmbedBuilder, InteractionType, ApplicationCommandOptionType, channelMention } from 'discord.js'
import { CommandError } from '../utils/error.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }
import * as fs from 'node:fs'

export default class Commands {
    /**
     * @param {Client} client client Discord
     */
    constructor(client) {
        this.client = client
    }

    /**
     * Récupération des options d'une commande exécutée
     * @param {Array<Object>} commandInteractionOptions données de la commande exécutée
     * @returns {Array<string>} liste des options de la commande exécutée
     */
    getCommandOptions(commandInteractionOptions) {
        return commandInteractionOptions.flatMap(d => {
            switch(d.type) {
                case ApplicationCommandOptionType.Attachment:
                    return `${d.name}:${d?.attachment?.name}`
                case ApplicationCommandOptionType.Subcommand:
                    const subCommandName = d.name
                    return [subCommandName, ...this.getCommandOptions(d.options)]
                case ApplicationCommandOptionType.SubcommandGroup:
                    const subCommandGroupName = d.name
                    return [subCommandGroupName, ...this.getCommandOptions(d.options)]
                default:
                    return `${d.name}:${d?.value}`
            }
        })
    }

    /**
     * Chargement des commandes au démarrage du Bot
     */
    async load() {
        const commands = [] // Liste des commandes
        this.client.commands = new Collection()
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

        // On récupère les commandes
        for(const file of commandFiles) {
            const { default: command } = await import(`../commands/${file}`)
            commands.push(command.data)
            Logger.log('CommandManager', 'INFO', `Commande "/${command.data.name}" trouvée`)
            this.client.commands.set(command.data.name, command)
        }

        // On ajoute chaque commande au serveur
        Logger.log('CommandManager', 'INFO', `Actualisation des commandes (/) de l'application`)
        const guild = this.client.guilds.cache.get(config.guild.id)
        await guild.commands.set(commands)
        Logger.log('CommandManager', 'INFO', 'Fin de l\'actualisation des commandes (/) de l\'application')
    }
    
    /**
     * Écoute des saisies de commandes
     */
    async listen() {
        this.client.on('interactionCreate', async interaction => {
            if(interaction.type !== InteractionType.ApplicationCommand) return
        
            const command = this.client.commands.get(interaction.commandName)
        
            if(!command) return
        
            try {
                const commandOptions = this.getCommandOptions(interaction.options.data)
                Logger.log('CommandManager', 'INFO', `${interaction.user.tag} a exécuté la commande "/${interaction.commandName}${commandOptions.length > 0 ? ` ${commandOptions.join(' ')}` : ''}"`)

                // On test si la commande est exécutée depuis le bon channel
                if(command.channels) {
                    for(const channel of command.channels) {
                        if(config.guild.channels[channel] !== interaction.channelId) {
                            throw new CommandError('Merci d\'effectuer cette commande dans un des channels suivant :\n' + command.channels.map(channel => channelMention(config.guild.channels[channel])).join('\n'), interaction.commandName)
                        }
                    }
                }

                await command.execute(interaction)
            } catch(error) {
                let errMessage
                if(error instanceof CommandError) {
                    errMessage = error.message
                } else {
                    errMessage = 'Une erreur est survenue lors de l\'exécution de la commande'
                    Logger.log('CommandManager', 'ERROR', `L'exécution de la commande "/${interaction.commandName}" a échoué : ${error.message}`)
                }

                const embed = new EmbedBuilder()
                        .setColor('#E74C3C')
                        .setDescription(`❌ ${errMessage}`)
                
                if(!interaction.deferred && !interaction.replied) {
                    await interaction.reply({ embeds: [embed], ephemeral: true })
                } else {
                    await interaction.editReply({ embeds: [embed] })
                }
            }
        })
    }
}