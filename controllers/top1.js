const { Top1Error } = require('../utils/error')
const members = require('./members')
const Database = require('./database')

module.exports = {
    /**
     * Vérifie si un membre est inscript au top 1 FR
     * @param {string} memberId identifiant du membre Discord
     * @returns {Promise<boolean>}
     */
    isSubscribed: async function(memberId) {
        const member = await members.getMember(memberId)

        return member.top1 === undefined || member.top1 === true ? true : false
    },

    /**
     * Inscrit/Désinscrit un membre au top 1 FR
     * @param {string} memberId identifiant du membre Discord
     * @param {boolean} subscribe
     */
    subscribe: async function(memberId, subscribe) {
        const client = new Database()

        try {
            const db = await client.connect()
            const m = db.collection('members')

            await m.updateOne(
                {
                    memberId: memberId,
                },
                {
                    $set: {
                        top1: subscribe
                    }
                },
                { upsert: true }
            )
        } finally {
            client.close()
        }
    }
}