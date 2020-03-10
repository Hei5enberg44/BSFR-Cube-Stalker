class LeaderboardCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "ld",
            Aliases: ["server", "serverlead", "lead"],
            Usage: "[<nb>]",
            Description: "Affiche le classement du serveur (10 défaut, 20 max, 1 min)",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {
        let nb = args[0];
        if (!nb) {
            nb = 10
        } else if((nb > 20 || nb < 1) || isNaN(parseInt(nb))) {
            await message.channel.send("> :slight_smile:  Le top 10 sera affiché.");
            nb = 10
        }

        let lb = await this.utils.ServerLeaderboard.getLeaderboardServer(message.guild.id);

        let desc = "";
        let pos = 0;
        for(let i in lb) {
            pos++;
            desc += "#" + pos + " - [**" + lb[i].name + "**](https://scoresaber.com/u/" + lb[i].playerid + ") :flag_" + lb[i].country.toLowerCase() + ": - " + lb[i].pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp\n"
        }
        // desc += "```"

        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            let embed = this.utils.Embed.embed();
            embed.setTitle("Classement Serveur (" + lb.length + " joueurs)")
                .setDescription(desc)
                .setColor('#000000');

            channel.send(embed);
        })
     }

}

module.exports = LeaderboardCommand;