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
        this.utils = opt.utils;
    }

    async checkApiIsUp(){
	try {
	    let data = (await axios.get(this.config.scoresaber.apiUrl + '/api/')).data.response
	    if(data == "hey")
		return true
	    else
		return false
	} catch (e) {
	    return false
	}
    }

    /**
     * Fonction de refresh forcé du profil ScoreSaber.
     * @param id
     * @returns {Promise<*>}
     */
    async refreshProfile(id) {
        try {
            let data = (await axios.get(this.config.scoresaber.apiUrl + '/api/manage/user/' + id + '/refresh')).data.updated
            return data;
        } catch(e) {
            this.utils.Logger.log("ScoreSaber refreshProfile: " + e.toString());
            return false;
        }
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
            firstRoleName = "12 000pp"
        } else if(ply.pp >= 11000 && ply.pp < 12000) {
            firstRoleName = "11 000pp";
            if(ply.pp >= 11500)
                secondRoleName = "11 500pp"
        } else if(ply.pp >= 10000 && ply.pp < 11000) {
            firstRoleName = "10 000pp";
            if(ply.pp >= 10500)
                secondRoleName = "10 500pp"
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

	let firstroles = member.roles.cache.filter(role => role.name.indexOf("000pp") > -1);
	let secondroles = member.roles.cache.filter(role => role.name.indexOf("500pp") > -1);

	firstroles.forEach(async function(role) {
	    if(firstRoleName != role.name) {
		await member.roles.remove(role);
		//await message.channel.send("> :checkered_flag: **[DEBUG]** Retiré: " + role.name);
	    }
	});

	secondroles.forEach(async function(role) {
	    if(secondRoleName != role.name) {
	    	await member.roles.remove(role);
		//await message.channel.send("> :checkered_flag: **[DEBUG]** Retiré: " + role.name);
	    }
	})

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
            this.utils.Logger.log("ScoreSaber getProfile: " + response.toString());
            return false;
        }
    }

    async getStonkerCard(id, message) {

        let response = await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/full');
        if(!response) {
            return "L'API ScoreSaber ne répond pas.";
        }
        if(response.data.error) {
            return "Une erreur est survenue.";
        }

        let leaderboardServer = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        let ply = new Player();
        ply.setPlayer(response.data);
        let player = ply.getPlayer();

        let foundInLb;
        for(let l in leaderboardServer) {
            if(leaderboardServer[l].playerid === player.playerId) {
                foundInLb = leaderboardServer[l];
            }
        }

        if(!foundInLb || !foundInLb.global) {
            return "Veuillez exécuter la commande ``" + this.config.discord.prefix + "me`` au moins une fois avant de générer la card.";
        }

        let diff = foundInLb.global - player.rank;

        let mode;
        if(diff > 0) {
            mode = "stonks";
        } else if(diff === 0) {
            mode = "confused";
        } else if(diff < 0) {
            mode = "notstonks";
            diff = diff * -1
        }

        const { registerFont, createCanvas, loadImage } = require('canvas');
        const countries = require('../assets/country.json');
        registerFont('./assets/NeonTubes2.otf', { family: 'Neon Tubes' });

        const canvas = createCanvas(1398, 960);
        const ctx = canvas.getContext('2d');

        const background = await loadImage('./assets/' + mode + '.png');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.font = '85px "Neon Tubes"';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(player.playerName, 300, canvas.height - 150);

        ctx.font = '62px "Neon Tubes"';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("#" + player.rank + " (" + player.pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp)" , 400, canvas.height - 70);

        let countryFound;
        for(let i in countries) {
            if(player.country === countries[i].abbreviation) {
                countryFound = countries[i].country.toLowerCase().replace(/ /g, "-")
            }
        }

        const flag = await loadImage('./assets/flags/' + countryFound + '.png');
        ctx.drawImage(flag, 70, canvas.height - 215, 150, 150);

        ctx.globalAlpha = 0.5;

        const black = await loadImage('./assets/flags/black.png');
        ctx.drawImage(black, 70, canvas.height - 215, 150, 150);

        ctx.globalAlpha = 1;

        ctx.font = '58px "Neon Tubes"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText("#" + player.countryRank, 142, canvas.height - 117, 140);

        ctx.save();
        const avatar = await loadImage(this.config.scoresaber.apiUrl + player.avatar);
        let change;
        let color;
        if(mode === "stonks") {
            ctx.beginPath();
            ctx.arc(330, 180, 150, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 180, 30, 300, 300);

            change = await loadImage('./assets/flags/plus.png');
            color = "#ffffff"
        } else if(mode === "confused") {
            ctx.beginPath();
            ctx.arc(300, 180, 150, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 150, 30, 300, 300);

            change = await loadImage('./assets/flags/yellow.png');
            color = "#000000"
        } else {
            ctx.beginPath();
            ctx.arc(280, 155, 150, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 130, 5, 300, 300);

            change = await loadImage('./assets/flags/moins.png');
            color = "#ffffff"
        }
        ctx.restore();
        ctx.drawImage(change, 300, canvas.height - 130, 70, 70);

        ctx.font = 'Bold 32px "Neon Tubes"';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';

        ctx.fillText(diff, 335, canvas.height - 83);

        return canvas.toBuffer()

    }

    /**
     * Fonction de récupération du meilleur score avec un snowflake id.
     * @param id
     * @returns {Promise<*>}
     */
    async getTopScore(id) {
        try {
            let score = (await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/scores/top')).data.scores[0];

            return score
        } catch(e) {
            this.utils.Logger.log("ScoreSaber getTopScore: " + e.toString());
            return false;
        }
    }

    /**
     * Fonction qui permet de retourner le leaderboard mondial.
     * @returns {Promise<T|boolean>}
     */
    async getLeaderboard() {
        try {
            let data = (await axios.get(this.config.scoresaber.apiUrl + '/api/players/1')).data
            return data;
        } catch(e) {
            this.utils.Logger.log("ScoreSaber getLeaderboard: " + e.toString());
            return false;
        }
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
            firstRoleName = "12 000pp"
        } else if(ply.pp >= 11000 && ply.pp < 12000) {
            firstRoleName = "11 000pp";
            if(ply.pp >= 11500)
                secondRoleName = "11 500pp"
        } else if(ply.pp >= 10000 && ply.pp < 11000) {
            firstRoleName = "10 000pp";
            if(ply.pp >= 10500)
                secondRoleName = "10 500pp"
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

        let firstroles = member.roles.cache.filter(role => role.name.indexOf("000pp") > -1);
	let secondroles = member.roles.cache.filter(role => role.name.indexOf("500pp") > -1);

	firstroles.forEach(async function(role) {
	    if(firstRoleName != role.name)
		await member.roles.remove(role)
		//await message.channel.send("> :checkered_flag: **[DEBUG]** Retiré: " + role.name);
	})

	secondroles.forEach(async function(role) {
	    if(secondRoleName != role.name)
		await member.roles.remove(role)
		//await message.channel.send("> :checkered_flag: **[DEBUG]** Retiré: " + role.name);
	})

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
        let guild = await this.clients.discord.getClient().guilds.resolve(guildId);
        await guild.members.cache.forEach((async (member) => {
            const id = await (await this.clients.redis.quickRedis()).get(member.user.id);
            if(id !== null) {
		await this.getProfileRefresher(id, guild, member);
            }
        }));
    }
}

module.exports = ScoreSaber;
