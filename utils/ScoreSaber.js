const axios = require('axios');
const Player = require('../objects/Player.js');

class ScoreSaber {
    constructor(opt) {
        this.config = opt.config;
    }

    async refreshProfile(id) {
        return (await axios.get(this.config.scoresaber.apiUrl + '/api/manage/user/' + id + '/refresh')).data.updated
    }

    async refreshRoles(ply, message) {

        let firstRoleName;
        let secondRoleName;

        if(ply.pp >= 10000) {
            firstRoleName = "10000pp"
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

        let member = message.guild.members.resolve(message.author.id);

        let hasRoleFirst = member.roles.cache.some(r=>[firstRoleName].includes(r.name));
        let hasRoleSecond = member.roles.cache.some(r=>[secondRoleName].includes(r.name));

        if(hasRoleFirst) {
            if(!hasRoleSecond) {
                member.roles.cache.map(async role => {
                    if(role.name.indexOf("00pp") > -1) {
                        await member.roles.remove(role);
                    }
                });
            }
        } else {
            member.roles.cache.map(async role => {
                if(role.name.indexOf("00pp") > -1) {
                    await member.roles.remove(role);
                }
            });
        }

        if(!hasRoleFirst) {
            let roleFirst = await message.guild.roles.cache.find(role => role.name === firstRoleName);
            await member.roles.add(roleFirst);
        }
        if(secondRoleName) {
            if(!hasRoleSecond) {
                let roleSecond = await message.guild.roles.cache.find(role => role.name === secondRoleName);
                await member.roles.add(roleSecond);
            }
        }

        /*
        if(MasterGuild.members.get(user.id).roles.some(r=>["Event Notifications"].includes(r.name))) {


        let usr = await MasterGuild.members.find(use => use.id == user.id)
                    let role = await MasterGuild.roles.find(role => role.name == "Event Notifications")
                    await usr.removeRole(role)

let mem = await MasterGuild.members.get(user.id);

let role = await MasterGuild.roles.find(role => role.name == "Event Notifications")
                await mem.addRole(role).catch(console.error);

         */

    }

    async getProfile(id, roleCheck, message) {
        let player = new Player();
        let response = await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/full');
        player.setPlayer(response.data);
        await this.refreshRoles(player.getPlayer(), message);
        return player.getPlayer();
    }

    async getTopScore(id) {
        let score = (await axios.get(this.config.scoresaber.apiUrl + '/api/player/' + id + '/scores/top')).data.scores[0]
        score.diff = score.diff.split("_")[1];

        return score
    }

    async getLeaderboard() {
        return (await axios.get(this.config.scoresaber.apiUrl + '/api/players/1')).data
    }
}

module.exports = ScoreSaber;