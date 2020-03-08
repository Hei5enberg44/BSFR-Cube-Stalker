const Discord = require("discord.js");

class Embed {
    embed() {
        return new Discord.MessageEmbed()
            .setColor('#fffff1')
            .setFooter('Cube Stalker ' + require("../package.json").version, 'https://cdn.discordapp.com/avatars/555566518167928863/8cd462d8e941fdfa335ba03052cd95df.webp?size=128');
    }
}

module.exports = Embed;