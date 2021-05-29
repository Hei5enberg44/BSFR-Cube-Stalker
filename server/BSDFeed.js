// Dépendance
const express = require("express");
const path = require('path');
const app = express();

class BSDFeed {

    /**
     * Constructeur du BSDFeed
     * @param opt
     */
    constructor(opt) {
        this.config = opt.config;
        this.clients = opt.clients;
    }

    /**
     * Fonction d'initialisation du feed BSD
     */
    init() {
        // Configuration Express
        app.listen(this.config.server.bsdFeed.port);
        app.use(express.static(path.join(__dirname, 'build')));
        app.use(express.json());

        let scoreSaberClient = this.clients.scoresaber

        // Call API
        app.post('/bsd_feed', async function (req, res) {
            await scoreSaberClient.checkIfNewScoreIsFirst(req.body)

            // Réponse
            res.send("ok")
        });

        console.log("BsdFeed: Ready.")
    }
}

module.exports = BSDFeed;