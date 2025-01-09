import { Guild } from 'discord.js'
import { ConfigError } from '../utils/error.js'
import config from '../config.json' assert { type: 'json' }

type NestedRecord = { [k: string]: string | NestedRecord }

export default class Config {
    public static test(guild: Guild) {
        const channels = config.guild.channels
        this.testChannels(guild, channels)

        const roles = config.guild.roles
        this.testRoles(guild, roles)
    }

    private static testChannels(guild: Guild, channels: NestedRecord) {
        for(const [channelName, channelId] of Object.entries(channels)) {
            if(typeof channelId === 'string') {
                if(!guild.channels.cache.get(channelId))
                    throw new ConfigError(`Le salon "${channelName}" ayant pour identifiant "${channelId}" n'existe pas sur la guilde`)
            } else {
                this.testRoles(guild, channels)
            }
        }
    }

    private static testRoles(guild: Guild, roles: NestedRecord) {
        for(const [roleName, roleId] of Object.entries(roles)) {
            if(typeof roleId === 'string') {
                if(!guild.roles.cache.get(roleId))
                    throw new ConfigError(`Le rôle "${roleName}" ayant pour identifiant "${roleId}" n'existe pas sur la guilde`)
            } else {
                this.testRoles(guild, roleId)
            }
        }
    }
}