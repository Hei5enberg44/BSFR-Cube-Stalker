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
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: true
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
            let posShow;
            if(pos === 1) {
                posShow = ":first_place:"
            } else if(pos === 2) {
                posShow = ":second_place:"
            } else if(pos === 3) {
                posShow = ":third_place:"
            } else {
                posShow = "#" + pos;
            }
            //desc += posShow + " - **" + lb[i].name + "** :flag_" + lb[i].country.toLowerCase() + ": - " + lb[i].pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp [``🔗``](https://scoresaber.com/u/" + lb[i].playerid + ")\n"
            desc += posShow + " - :flag_" + lb[i].country.toLowerCase() + ": [" + lb[i].name + "](https://scoresaber.com/u/" + lb[i].playerid + ") - " + lb[i].pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp\n"
        }
        // desc += "```"

        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            let embed = this.utils.Embed.embed();
            if(lb.length) {
                let j = "joueur";
                if(lb.length !== 1) {
                    j = "joueurs"
                }
                embed.setTitle("Classement Serveur (" + lb.length + " " + j + ")")
                    .setDescription(desc)
                    .setColor('#000000');
            } else {
                embed.setTitle("Classement Serveur")
                    .setDescription("Aucun joueur enregistré sur ce serveur.")
                    .setColor('#000000');
            }

            channel.send(embed);
        })
     }

}

module.exports = LeaderboardCommand;