const { MemberError } = require('../utils/error')
const leaderboard = require('./leaderboard')
const Database = require('./database')

module.exports = {
    /**
     * Récupère un membre depuis la table « members »
     * @param {number} memberId identifiant Discord du membre
     * @returns {Promise<{memberId: number, scoreSaberId: number}>} membre Discord
     */
    getMember: async function(memberId) {
        const client = new Database()

        try {
            const db = await client.connect()
            const m = db.collection('members')

            return m.findOne({
                memberId: memberId
            })
        } finally {
            client.close()
        }
    },

    /**
     * Ajoute un membre dans la table « members »
     * @param {number} memberId identifiant Discord du membre
     * @param {string} scoreSaberId identifiant du profil ScoreSaber du membre
     * @param {boolean} isAdmin indique si il s'agit d'un admin/modérateur qui a exécuté la commande
     */
    addMember: async function(memberId, scoreSaberId, isAdmin = false) {
        const client = new Database()

        try {
            const db = await client.connect()
            const m = db.collection('members')

            if(isAdmin) {
                // On vérifie si le membre Discord à déjà un profil ScoreSaber lié
                const profilIsAlreadyLinked = await m.countDocuments({ memberId: memberId })
                if(profilIsAlreadyLinked > 0) throw new MemberError('Ce compte Discord est déjà lié à un profil ScoreSaber\nVeuillez utiliser la commande `/unlink` avant de lier un autre profil ScoreSaber\n(Cette commande peut être utilisée dans la limite de 1 par mois)')
            }

            // On vérifie si le profil ScoreSaber est déjà lié à un membre Discord
            const memberWithScoreSaberId = await m.countDocuments({ scoreSaberId: scoreSaberId })
            if(memberWithScoreSaberId > 0) throw new MemberError('Ce profil ScoreSaber est déjà relié à un compte Discord')

            await leaderboard.delMemberLeaderboard(memberId)

            await m.updateOne(
                {
                    memberId: memberId,
                },
                {
                    $set: {
                        memberId: memberId,
                        scoreSaberId: scoreSaberId
                    }
                },
                { upsert: true }
            )
        } finally {
            client.close()
        }
    },

    /**
     * Supprime un membre des tables « members » et « leaderboard »
     * @param {number} memberId identifiant Discord du membre
     */
    delMember: async function(memberId) {
        const client = new Database()

        try {
            const db = await client.connect()
            const m = db.collection('members')

            await leaderboard.delMemberLeaderboard(memberId)

            await m.deleteOne({ memberId: memberId })
        } finally {
            client.close()
        }
    }
}