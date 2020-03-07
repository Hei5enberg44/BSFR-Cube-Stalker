const https = require('https');

class ScoreSaber {
    constructor() {

    }

    getInfo() {
        https.get('https://new.scoresaber.com/api/player/2429129807113296/full', function(response) {
            response.on('data', function(data) {
                console.log( JSON.parse(data) );
            });
        }).on('error', function(e) {
            console.error(e);
        });
    }
}

module.exports = ScoreSaber;