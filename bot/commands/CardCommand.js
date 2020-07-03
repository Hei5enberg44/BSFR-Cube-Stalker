const { MessageAttachment } = require("discord.js")
const util = require("util");

class HelpCommand {

    /**
     * Constructeur de la commande
     * @param opt
     */
    constructor(opt) {
        this.clients = opt.clients;
        this.commands = opt.commands;
        this.utils = opt.utils;
        this.config = opt.config;
    }

    /**
     * Permet de récupérer la "metadata" de la commande.
     * @returns {{Usage: string, Description: string, Command: string, ShowInHelp: boolean, Run: (function(*=, *=): void), Aliases: [string, string]}}
     */
    getCommand() {
        return {
            Command: "card",
            Aliases: ["rankcard"],
            Usage: "",
            Description: "Génère une carte de stonker certifié.",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: true
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param args
     * @param message
     */
    async exec(args, message) {

        // On regarde quel utilisateur a été choisi.
        let discordSelected, discordMember;
        if(args[0]) {
            let promisifiedMember = util.promisify(this.utils.DiscordServer.getMember);
            let memberFound = await promisifiedMember(message.guild, args[0]);
            if(!memberFound) {
                await message.channel.send("> :x:  Aucun utilisateur trouvé.");
                return;
            }
            // L'utilisateur ayant été trouvé, on modifie les valeurs de "target".
            discordMember = memberFound;
            discordSelected = memberFound.user.id
        } else {
            // Aucune autre argument mentionné, donc la "target" est la personne ayant exécuté la commande.
            discordSelected = message.author.id;
            discordMember = message.author
        }

        // On regarde si l'utilisateur "target" a lié son compte Discord à un profil ScoreSaber.
        const id = await (await this.clients.redis.quickRedis()).get(discordSelected);

        // Si l'utilisateur n'a pas relié de profil, on exécute ce qui figure ci dessous.
        if(id === null) {
            // Si quelqu'un d'autre à fait la commande pour quelqu'un d'autre.
            if(args[0])
                await message.channel.send("> :x:  Aucun profil ScoreSaber n'est lié pour le compte Discord ``" + discordMember.user.tag + "``.");
            else
                await message.channel.send("> :x:  Aucun profil ScoreSaber n'est lié avec votre compte Discord!\nUtilisez la commande ``" + this.config.discord.prefix + "profil [lien scoresaber]`` pour pouvoir en lier un.");
            return;
        }

        const stonkerProfile = await this.utils.ScoreSaber.getStonkerCard(id, message);

        if(typeof stonkerProfile === 'string') {
            await message.channel.send("> :x:  " + stonkerProfile);
            return
        }

        const attachment = new MessageAttachment(stonkerProfile, 'howlargeismypp.png');
        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await message.channel.send("> :bulb:  La remise à zero du changement de rang global se fait avec la commande ``" + this.config.discord.prefix + "me`` et seul le détenteur du profil ScoreSaber ne peut faire cela.\n‎", attachment);
    }

}

module.exports = HelpCommand;