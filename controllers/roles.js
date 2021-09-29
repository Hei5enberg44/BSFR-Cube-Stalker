const { GuildMember } = require('discord.js')

module.exports = {
    /**
     * Met à jour les rôles de pp d'un membre
     * @param {GuildMember} member membre Discord à mettre à jour
     * @param {number} pp nombre de pp du membre
     */
    updateMemberPpRoles: async function(member, pp) {
        const memberPpRoles = member.roles.cache.filter(role => role.name.match(/^[0-9\s]+pp$/))

        // On détermine la liste des rôles de pp à assigner au membre
        const t = Math.floor(pp / 1000)
        const h = pp % 1000 > 500
        const newPpRoles = [ Intl.NumberFormat('en-US').format(t * 1000).replace(',', ' ') + 'pp' ]
        if(h) newPpRoles.push(Intl.NumberFormat('en-US').format(t * 1000 + 500).replace(',', ' ') + 'pp')

        const oldPpRoles = memberPpRoles.map(m => m.name)

        // Si l'utilisateur n'a pas déjà les bons rôles, on met à jour ceux-ci
        if(!(oldPpRoles.length === newPpRoles.length && oldPpRoles.every((m, i) => m === newPpRoles[i]))) {
            // Liste des rôles du serveur
            await member.guild.roles.fetch()
            const roles = member.guild.roles.cache

            // Suppression des rôles de pp au membre
            for(const [, role] of memberPpRoles) {
                const roleSearch = newPpRoles.indexOf(role.name)
                // Si le rôle de pp à ajouter est déjà attribué au membre, on le conserve
                if(roleSearch !== -1) {
                    newPpRoles.splice(roleSearch, 1)
                } else {
                    // Sinon, on le supprime
                    const roleToDelete = roles.find(r => r.name === role.name)
                    if(roleToDelete) {
                        member.roles.remove(roleToDelete)
                    }
                }
            }

            // Ajout des rôles de pp au membre
            for(const roleName of newPpRoles) {
                const roleToAdd = roles.find(r => r.name === roleName)
                if(roleToAdd) {
                    member.roles.add(roleToAdd)
                }
            }
        }
    }
}