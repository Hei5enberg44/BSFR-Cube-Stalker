class MeCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "top",
            Aliases: ["world", "worldlead"],
            Usage: "[<nb>]",
            Description: "Affiche le classement mondial (10 défaut, 20 max, 1 min)",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {
        let nb = args[0]
        if (!nb) {
            nb = 10
        } else if((nb > 20 || nb < 1) || isNaN(parseInt(nb))) {
            await message.channel.send("> :slight_smile:  Le top 10 sera affiché.")
            nb = 10
        }

        let lb = await this.utils.ScoreSaber.getLeaderboard();

        let desc = ""
        for(let i = 0; i < nb; i++) {
            let posShow;
            if(lb[i].rank === 1) {
                posShow = ":first_place:"
            } else if(lb[i].rank === 2) {
                posShow = ":second_place:"
            } else if(lb[i].rank === 3) {
                posShow = ":third_place:"
            } else {
                posShow = "#" + lb[i].rank;
            }
            desc += posShow + " - :flag_" + lb[i].country.toLowerCase() + ": **" + lb[i].name + "** - " + lb[i].pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp\n"
            //desc += posShow + " - [" + lb[i].name + "](https://scoresaber.com/u/" + lb[i].playerid + ") :flag_" + lb[i].country.toLowerCase() + ": - " + lb[i].pp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "pp\n"
        }
        // desc += "```"

        this.clients.discord.getClient().channels.fetch("613064448009306118").then(channel => {
            let embed = this.utils.Embed.embed();
            embed.setTitle("Classement Mondial")
                .setURL(this.config.scoresaber.url + "/global")
                .setDescription(desc)
                .setColor('#000000');

            channel.send(embed);
        })
     }

}

module.exports = MeCommand;