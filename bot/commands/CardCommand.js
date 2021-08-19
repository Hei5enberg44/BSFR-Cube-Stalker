const fs = require("fs");

class CardCommand {

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
    get meta() {
        return {
            name: "card",
            description: "Génère une carte de stonker certifié.",
            options: {
                "player": {
                    "name": "joueur",
                    "type": "user",
                    "description": "Demander la carte d'un autre membre",
                    "required": false
                },
                "gif": {
                    "name": "gif",
                    "type": "boolean",
                    "description": "Demander la carte au format GIF",
                    "required": false
                }
            }
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param interaction
     */
    async exec(interaction) {
        let gif = false
        let user = interaction.user

        if(interaction.options._hoistedOptions.filter((args) => args.name === "gif").length > 0)
            gif = interaction.options._hoistedOptions.filter((args) => args.name === "gif")[0].value

        if(interaction.options._hoistedOptions.filter((args) => args.name === "joueur").length > 0)
            user = interaction.options._hoistedOptions.filter((args) => args.name === "joueur")[0].user

        // On regarde si l'utilisateur "target" a lié son compte Discord à un profil ScoreSaber.
        const id = await (await this.clients.redis.quickRedis()).get(user.id);

        // Si l'utilisateur n'a pas relié de profil, on exécute ce qui figure ci dessous.
        if(id === null) {
            // Si quelqu'un d'autre à fait la commande pour quelqu'un d'autre.
            if(user.id !== interaction.user.id)
                await interaction.reply({ content: "> :x:  Aucun profil ScoreSaber n'est lié pour le compte Discord ``" + user.tag + "``.", ephemeral: true });
            else
                await interaction.reply({ content: "> :x:  Aucun profil ScoreSaber n'est lié avec votre compte Discord!\nUtilisez la commande ``/profil [lien scoresaber]`` pour pouvoir en lier un.", ephemeral: true });
            return;
        }

        const stonkerProfile = await this.utils.ScoreSaber.getStonkerCard(id, interaction.user.id, gif);

        if(typeof stonkerProfile === 'string') {
            await interaction.reply({ content: "> :x:  " + stonkerProfile, ephemeral: true });
            return
        }

        // On envoie l'embed dans le channel ou celui-ci a été demandé.
        await interaction.reply({ ...stonkerProfile });

        await fs.unlinkSync(stonkerProfile.files[0]);

    }

}

module.exports = CardCommand;