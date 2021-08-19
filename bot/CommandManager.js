const { REST } = require("@discordjs/rest")
const { SlashCommandBuilder } = require('@discordjs/builders')
const { Routes } = require('discord-api-types/v9');
const fs = require("fs");

class CommandManager {
    constructor(opt) {
        this.config = opt.config;
        this.utils = opt.utils;
        this.clients = opt.clients;

        this.commands = {}
        this.slashCommands = []
    }

    async init() {
        // On "scan" le dossier des commandes et on ajoute les commandes.
        fs.readdirSync("./bot/commands/").forEach(file => {
            let cmd = new (require("./commands/" + file))(this)

            this.utils.Logger.log("[CommandManager] Find '" + cmd.meta.name + "'")

            this.commands[cmd.meta.name] = cmd

            let slashCommand = new SlashCommandBuilder()
                .setName(cmd.meta.name)
                .setDescription(cmd.meta.description)

            if(cmd.meta.options !== undefined) {
                for (const [, cmdOption] of Object.entries(cmd.meta.options)) {
                    switch(cmdOption.type) {
                        case "string":
                            slashCommand.addStringOption(option =>
                                option.setName(cmdOption.name)
                                    .setDescription(cmdOption.description)
                                    .setRequired(cmdOption.required));
                            break;
                        case "boolean":
                            slashCommand.addBooleanOption(option =>
                                option.setName(cmdOption.name)
                                    .setDescription(cmdOption.description)
                                    .setRequired(cmdOption.required));
                            break;
                        case "user":
                            slashCommand.addUserOption(option =>
                                option.setName(cmdOption.name)
                                    .setDescription(cmdOption.description)
                                    .setRequired(cmdOption.required))
                            break;
                        case "integer":
                            slashCommand.addIntegerOption(option =>
                                option.setName(cmdOption.name)
                                    .setDescription(cmdOption.description)
                                    .setRequired(cmdOption.required))
                            break;
                    }
                }
            }

            this.slashCommands.push(slashCommand.toJSON())
        })

        const rest = new REST({ version: '9' }).setToken(this.config.discord.token)

        try {
            this.utils.Logger.log("[CommandManager] Started refreshing application (/) commands.")

            await rest.put(
                Routes.applicationGuildCommands(this.config.discord.clientId, this.config.discord.guildId),
                { body: this.slashCommands },
            );

            this.utils.Logger.log("[CommandManager] SUCCESS: Refresh application (/) commands")

            let guild = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
            let commands = await guild?.commands.fetch()

            for(const [, command] of commands.entries()) {
                if(this.commands[command.name].meta.roles) {
                    let permissions = []
                    for(let i in this.commands[command.name].meta.roles) {
                        let role = guild.roles.cache.find(role => role.name === this.commands[command.name].meta.roles[i])
                        permissions = [...permissions, {
                            id: role.id,
                            type: "ROLE",
                            permission: true
                        }]
                    }

                    let role = guild.roles.cache.find(role => role.name === "@everyone")
                    permissions = [...permissions, {
                        id: role.id,
                        type: "ROLE",
                        permission: false
                    }]

                    await command.permissions.set({ permissions })
                }
            }

        } catch (error) {
            this.utils.Logger.log("[CommandManager] ERROR: " + error)
        }

        this.registerEvent()
    }

    registerEvent() {
        this.clients.discord.getClient().on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
            if (interaction.channelId !== this.config.discord.channel)
                return await interaction.reply({ content: "> :x: Merci d'effectuer la commande dans <#" + this.config.discord.channel + ">", ephemeral: true });

            if(this.commands[interaction.commandName] !== undefined) {
                this.utils.Logger.log("[CommandManager] " + interaction.user.username + "#" + interaction.user.discriminator + " a exécuté la commande '" + interaction.commandName + "'")

                this.commands[interaction.commandName].exec(interaction)
            } else {
                await interaction.reply({ content: "Commande inexistante.", ephemeral: true });
            }
        });
    }
}

module.exports = CommandManager;