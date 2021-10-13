const { Collection, MessageEmbed } = require('discord.js')
const Logger = require('../utils/logger')
const { CommandError } = require('../utils/error')
const config = require('../config.json')
const fs = require('fs')

class Commands {
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
        const guild = await this.client.guilds.cache.get(config.guild.id)
        await guild.commands.set(commands).then(cmds => {
            const fullPermissions = []
            for(const [ commandId, cmd ] of cmds.entries()) {
                const roles = commandsRoles.find(cr => cr.name === cmd.name).roles
                if(roles) {
                    const permissions = []
                    for(const role of roles) {
                        const roleId = config.guild.roles[role]
                        permissions.push({
                            id: roleId,
                            type: 'ROLE',
                            permission: true
                        })
                    }
                    fullPermissions.push({ id: commandId, permissions: permissions })
                }
            }

            guild.commands.permissions.set({ fullPermissions: fullPermissions })
        })
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
                Logger.log('CommandManager', 'INFO', `${interaction.user.username}#${interaction.user.discriminator} a exécuté la commande "/${interaction.commandName}"`)
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
                        .setDescription(`:x: ${errMessage}`)
                
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