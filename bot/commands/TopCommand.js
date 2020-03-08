class MeCommand {

    constructor(opt) {
        this.clients = opt.clients;
        this.config = opt.config;
        this.utils = opt.utils;
    }

    getCommand() {
        return {
            Command: "top",
            Usage: this.config.discord.prefix + "top [<nb>]",
            Description: "Affiche le classement mondial (10 défaut, 20 max, 1 min)",
            Run: (args, message) => this.exec(args, message)
        }
    }

    async exec(args, message) {
        let nb = args[0]
        if (!nb) {
            nb = 10
        } else if((nb > 20 || nb < 1) || isNaN(parseInt(nb))) {
            await message.channel.send("> :slight_smile: | Le top 10 sera affiché.")
            nb = 10
        }

        let lb = await this.utils.ScoreSaber.getLeaderboard();

        let desc = ""
        for(let i = 0; i < nb; i++) {
            desc += "#" + lb[i].rank + " -  :flag_" + lb[i].country.toLowerCase() + ": " + lb[i].name + " - PP: " + lb[i].pp + " - Changement: " + lb[i].difference + "\n"
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