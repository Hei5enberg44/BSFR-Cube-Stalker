const { Client, Collection, MessageEmbed } = require('discord.js')
const { channelMention } = require('@discordjs/builders')
const { CommandError } = require('../utils/error')
const Logger = require('../utils/logger')
const config = require('../config.json')
const fs = require('fs')

class Commands {
    /**
     * @param {Client} client client Discord
     */
    constructor(client) {
        this.client = client
    }

    /**
     * Chargement des commandes au démarrage du Bot
     */
    async load() {
        const commands = [] // Liste des commandes
        const commandsRoles = [] // Liste des rôles
        this.client.commands = new Collection()
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

        // On ajoute chaque commande au serveur
        for(const file of commandFiles) {
            const command = require(`../commands/${file}`)
            commands.push(command.data)
            Logger.log('CommandManager', 'INFO', `Commande "/${command.data.name}" trouvée`)
            commandsRoles.push({ name: command.data.name, roles: command.roles ?? null })
            this.client.commands.set(command.data.name, command)
        }

        // On applique les rôles aux commandes
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
            if(!interaction.isCommand()) return
        
            const command = this.client.commands.get(interaction.commandName)
        
            if(!command) return
        
            try {
                Logger.log('CommandManager', 'INFO', `${interaction.user.tag} a exécuté la commande "/${interaction.commandName}"`)

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

                const embed = new MessageEmbed()
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

module.exports = Commands