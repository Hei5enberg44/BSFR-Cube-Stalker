const { MemberError } = require('../utils/error')
const leaderboard = require('./leaderboard')
const { Members, LastMembersMaps } = require('./database')

module.exports = {
    /**
     * Récupère un membre depuis la table « members »
     * @param {string} memberId identifiant Discord du membre
     * @returns {Promise<{memberId: number, scoreSaberId: number, top1: boolean}>} membre Discord
     */
    getMember: async function(memberId) {
        return await Members.findOne({
            where: {
                memberId: memberId
            }
        })
    },

    /**
     * Récupère la liste des membres depuis la table « members »
     * @returns {Promise<[{memberId: number, scoreSaberId: number}]>} membres Discord
     */
     getAllMembers: async function() {
        return await Members.findAll()
    },

    /**
     * Ajoute un membre dans la table « members »
     * @param {string} memberId identifiant Discord du membre
     * @param {string} scoreSaberId identifiant du profil ScoreSaber du membre
     * @param {boolean} isAdmin indique si il s'agit d'un admin/modérateur qui a exécuté la commande
     */
    addMember: async function(memberId, scoreSaberId, isAdmin = false) {
        if(!isAdmin) {
            // On vérifie si le membre Discord à déjà un profil ScoreSaber lié
            const profilIsAlreadyLinked = await Members.count({ where: { memberId: memberId } })
            if(profilIsAlreadyLinked > 0) throw new MemberError('Ce compte Discord est déjà lié à un profil ScoreSaber\nVeuillez utiliser la commande `/unlink` avant de lier un autre profil ScoreSaber\n(Cette commande peut être utilisée dans la limite de 1 par mois)')
        }

        // On vérifie si le profil ScoreSaber est déjà lié à un membre Discord
        const memberWithScoreSaberId = await Members.count({ where: { scoreSaberId: scoreSaberId } })
        if(memberWithScoreSaberId > 0) throw new MemberError('Ce profil ScoreSaber est déjà relié à un compte Discord')

        await leaderboard.delMemberLeaderboard(memberId)

        const member = await Members.findOne({
            where: {
                memberId: memberId
            }
        })

        if(!member) {
            Members.create({
                memberId: memberId,
                scoreSaberId: scoreSaberId,
                top1: true
            })
        } else {
            member.scoreSaberId = scoreSaberId
            await member.save()
        }
    },

    /**
     * Supprime un membre des tables « members » et « leaderboard »
     * @param {string} memberId identifiant Discord du membre
     */
    delMember: async function(memberId) {
        const member = await module.exports.getMember(memberId)

        if(member) {
            await leaderboard.delMemberLeaderboard(member.memberId)

            await Members.destroy({
                where: { memberId: member.memberId }
            })

            await LastMembersMaps.destroy({
                where: { scoreSaberId: member.scoreSaberId }
            })
        }
    }
}