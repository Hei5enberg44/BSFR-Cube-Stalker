const axios = require('axios');
const Player = require('../objects/Player.js');

class ScoreSaber {

    /**
     * Constructeur de l'util ScoreSaber.
     * @param opt
     */
    constructor(opt) {
        this.config = opt.config;
        this.clients = opt.clients;
    }

    /**
     * Fonction de refresh forcé du profil ScoreSaber.
     * @param id
     * @returns {Promise<*>}
     */
    async refreshProfile(id) {
        return (await axios.get(this.config.scoresaber.apiUrl + '/api/manage/user/' + id + '/refresh')).data.updated
    }

    /**
     * Fonction pour refresh les rôles de la guilde.
     * @param ply
     * @param message
     * @param targetUser
     * @returns {Promise<boolean>}
     */
    async refreshRoles(ply, message, targetUser) {

        let firstRoleName;
        let secondRoleName;

        if(ply.pp >= 12000) {
            firstRoleName = "12000pp"
        } else if(ply.pp >= 11000 && ply.pp < 12000) {
            firstRoleName = "11000pp";
            if(ply.pp >= 11500)
                secondRoleName = "11500pp"
        } else if(ply.pp >= 10000 && ply.pp < 11000) {
            firstRoleName = "10000pp";
            if(ply.pp >= 10500)
                secondRoleName = "10500pp"
        } else if(ply.pp >= 9000 && ply.pp < 10000) {
            firstRoleName = "9000pp";
            if(ply.pp >= 9500)
                secondRoleName = "9500pp"
        } else if(ply.pp >= 8000 && ply.pp < 9000) {
            firstRoleName = "8000pp";
            if(ply.pp >= 8500)
                secondRoleName = "8500pp"
        } else if(ply.pp >= 7000 && ply.pp < 8000) {
            firstRoleName = "7000pp";
            if(ply.pp >= 7500)
                secondRoleName = "7500pp"
        } else if(ply.pp >= 6000 && ply.pp < 7000) {
            firstRoleName = "6000pp";
            if(ply.pp >= 6500)
                secondRoleName = "6500pp"
        } else if(ply.pp >= 5000 && ply.pp < 6000) {
            firstRoleName = "5000pp";
            if(ply.pp >= 5500)
                secondRoleName = "5500pp"
        } else if(ply.pp >= 4000 && ply.pp < 5000) {
            firstRoleName = "4000pp";
            if(ply.pp >= 4500)
                secondRoleName = "4500pp"
        } else if(ply.pp >= 3000 && ply.pp < 4000) {
            firstRoleName = "3000pp";
            if(ply.pp >= 3500)
                secondRoleName = "3500pp"
        } else if(ply.pp >= 2000 && ply.pp < 3000) {
            firstRoleName = "2000pp";
            if(ply.pp >= 2500)
                secondRoleName = "2500pp"
        } else if(ply.pp >= 1000 && ply.pp < 2000) {
            firstRoleName = "1000pp";
            if(ply.pp >= 1500)
                secondRoleName = "1500pp"
        } else if(ply.pp >= 0 && ply.pp < 1000) {
            if(ply.pp >= 500)
                firstRoleName = "500pp"
        }

        if(!firstRoleName) {
            return;
        }

        let member = message.guild.members.resolve(targetUser);

        let hasRoleFirst = member.roles.cache.some(r=>[firstRoleName].includes(r.name));

        let hasRoleSecond;
        if(!secondRoleName)
            hasRoleSecond = true;
        else
            hasRoleSecond = member.roles.cache.some(r=>[secondRoleName].includes(r.name));

        if(hasRoleFirst) {
            if(!hasRoleSecond) {
                member.roles.cache.map(async role => {
                    if(role.name.indexOf("00pp") > -1) {
                        await member.roles.remove(role);
                        //await message.channel.send("> :checkered_flag:  **[DEBUG]** Retiré: " + role.name);
                    }
                });
            }
        } else {
            member.roles.cache.map(async role => {
                if(role.name.indexOf("00pp") > -1) {
                    await member.roles.remove(role);
                    //await message.channel.send("> :checkered_flag:  **[DEBUG]** Retiré: " + role.name);
                }
            });
        }

        if(!hasRoleFirst) {
            let roleFirst = await message.guild.roles.cache.find(role => role.name === firstRoleName);
            await member.roles.add(roleFirst);
            //await message.channel.send("> :checkered_flag:  **[DEBUG]** Ajouté: " + roleFirst.name);
        }
        if(secondRoleName) {
            if(!hasRoleSecond) {
                let roleSecond = await message.guild.roles.cache.find(role => role.name === secondRoleName);
                await member.roles.add(roleSecond);
                //await message.channel.send("> :checkered_flag:  **[DEBUG]** Ajouté: " + roleSecond.name);
            }
        }

        return true;

    }

    /**
     * Fonction pour récupérer le profil ScoreSaber avec un snowflake ID.
     * @param id
     * @param message
     * @param targetUser
     * @returns {Promise<{}|boolean>}
     */
    async getProfile(id, message, targetUser) {
        let player = new Player();
        let response = await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/full');
        if(response) {
            if(response.data.error) {
                return false;
            } else {
                player.setPlayer(response.data);
                await this.refreshRoles(player.getPlayer(), message, targetUser);
                return player.getPlayer();
            }
        } else {
            return false;
        }
    }

    /**
     * Fonction de récupération du meilleur score avec un snowflake id.
     * @param id
     * @returns {Promise<*>}
     */
    async getTopScore(id) {
        let score = (await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/scores/top')).data.scores[0];
        score.diff = score.diff.split("_")[1];

        return score
    }

    /**
     * Fonction qui permet de retourner le leaderboard mondial.
     * @returns {Promise<T>}
     */
    async getLeaderboard() {
        return (await axios.get(this.config.scoresaber.apiUrl + '/api/players/1')).data
    }

    // Fonctions faites exprès pour la crontab de refresh.

    async getProfileRefresher(id, guild, member) {
        let player = new Player();
        let response = await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/full');
        if(response) {
            if(response.data.error) {
                return false;
            } else {
                player.setPlayer(response.data);
                await this.refresherRole(player.getPlayer(), guild, member);
                return player.getPlayer();
            }
        } else {
            return false;
        }
    }

    async refresherRole(ply, guild, member) {

        let firstRoleName;
        let secondRoleName;

        if(ply.pp >= 12000) {
            firstRoleName = "12000pp"
        } else if(ply.pp >= 11000 && ply.pp < 12000) {
            firstRoleName = "11000pp";
            if(ply.pp >= 11500)
                secondRoleName = "11500pp"
        } else if(ply.pp >= 10000 && ply.pp < 11000) {
            firstRoleName = "10000pp";
            if(ply.pp >= 10500)
                secondRoleName = "10500pp"
        } else if(ply.pp >= 9000 && ply.pp < 10000) {
            firstRoleName = "9000pp";
            if(ply.pp >= 9500)
                secondRoleName = "9500pp"
        } else if(ply.pp >= 8000 && ply.pp < 9000) {
            firstRoleName = "8000pp";
            if(ply.pp >= 8500)
                secondRoleName = "8500pp"
        } else if(ply.pp >= 7000 && ply.pp < 8000) {
            firstRoleName = "7000pp";
            if(ply.pp >= 7500)
                secondRoleName = "7500pp"
        } else if(ply.pp >= 6000 && ply.pp < 7000) {
            firstRoleName = "6000pp";
            if(ply.pp >= 6500)
                secondRoleName = "6500pp"
        } else if(ply.pp >= 5000 && ply.pp < 6000) {
            firstRoleName = "5000pp";
            if(ply.pp >= 5500)
                secondRoleName = "5500pp"
        } else if(ply.pp >= 4000 && ply.pp < 5000) {
            firstRoleName = "4000pp";
            if(ply.pp >= 4500)
                secondRoleName = "4500pp"
        } else if(ply.pp >= 3000 && ply.pp < 4000) {
            firstRoleName = "3000pp";
            if(ply.pp >= 3500)
                secondRoleName = "3500pp"
        } else if(ply.pp >= 2000 && ply.pp < 3000) {
            firstRoleName = "2000pp";
            if(ply.pp >= 2500)
                secondRoleName = "2500pp"
        } else if(ply.pp >= 1000 && ply.pp < 2000) {
            firstRoleName = "1000pp";
            if(ply.pp >= 1500)
                secondRoleName = "1500pp"
        } else if(ply.pp >= 0 && ply.pp < 1000) {
            if(ply.pp >= 500)
                firstRoleName = "500pp"
        }

        if(!firstRoleName) {
            return;
        }

        let hasRoleFirst = member.roles.cache.some(r=>[firstRoleName].includes(r.name));

        let hasRoleSecond;
        if(!secondRoleName)
            hasRoleSecond = true;
        else
            hasRoleSecond = member.roles.cache.some(r=>[secondRoleName].includes(r.name));

        //await message.channel.send("> :checkered_flag:  **[DEBUG]** hasRoleFirst: " + hasRoleFirst + " - hasRoleSecond: " + hasRoleSecond);

        if(hasRoleFirst) {
            if(!hasRoleSecond) {
                member.roles.cache.map(async role => {
                    if(role.name.indexOf("00pp") > -1) {
                        await member.roles.remove(role);
                        //await message.channel.send("> :checkered_flag:  **[DEBUG]** Retiré: " + role.name);
                    }
                });
            }
        } else {
            member.roles.cache.map(async role => {
                if(role.name.indexOf("00pp") > -1) {
                    await member.roles.remove(role);
                    //await message.channel.send("> :checkered_flag:  **[DEBUG]** Retiré: " + role.name);
                }
            });
        }

        if(!hasRoleFirst) {
            let roleFirst = await guild.roles.cache.find(role => role.name === firstRoleName);
            await member.roles.add(roleFirst);
            //await message.channel.send("> :checkered_flag:  **[DEBUG]** Ajouté: " + roleFirst.name);
        }
        if(secondRoleName) {
            if(!hasRoleSecond) {
                let roleSecond = await guild.roles.cache.find(role => role.name === secondRoleName);
                await member.roles.add(roleSecond);
                //await message.channel.send("> :checkered_flag:  **[DEBUG]** Ajouté: " + roleSecond.name);
            }
        }

        return true;

    }

    /**
     * Fonction permettant le refresh entier d'une guilde.
     * @param guildId
     * @returns {Promise<void>}
     */
    async refreshGuild(guildId) {
        let guild = this.clients.discord.getClient().guilds.resolve(guildId);
        await guild.members.cache.forEach((async (member) => {
            const id = await (await this.clients.redis.quickRedis()).get(member.user.id);
            if(id !== null) {
                await this.getProfileRefresher(id, guild, member);
            }
        }));
    }
}

module.exports = ScoreSaber;