import { GuildMember } from 'discord.js'
import { Leaderboards } from './gameLeaderboard.js'
import config from '../config.json' with { type: 'json' }

export default class Roles {
    private static ldRoleExists<T extends object>(
        key: string | number | symbol,
        obj: T
    ): key is keyof T {
        return key in obj
    }

    /**
     * Récupère la liste des rôles de pp d'un membre
     * @param leaderboard nom du leaderboard (scoresaber | beatleader)
     * @param member membre Discord
     * @returns rôle de pp le plus élevé du membre
     */
    private static getMemberPpRoles(
        leaderboard: Leaderboards,
        member: GuildMember
    ) {
        const ldRoles =
            leaderboard === Leaderboards.ScoreSaber
                ? config.guild.roles.pp.scoresaber
                : config.guild.roles.pp.beatleader
        const roles = member.roles.cache.filter((role) =>
            Object.values(ldRoles).includes(role.id)
        )
        return roles
    }

    /**
     * Récupère la couleur du rôle de pp le plus élevé d'un membre
     * @param leaderboard nom du leaderboard (scoresaber | beatleader)
     * @param member membre Discord
     */
    static getMemberPpRoleColor(
        leaderboard: Leaderboards,
        member: GuildMember
    ) {
        const memberPpRoles = this.getMemberPpRoles(leaderboard, member)

        if (memberPpRoles.size > 0) {
            const memberPpRolesSorted = memberPpRoles.sort(
                (r1, r2) =>
                    parseInt(r1.name.replace(/(\s|pp)/, '')) -
                    parseInt(r2.name.replace(/(\s|pp)/, ''))
            )
            return memberPpRolesSorted.last()?.color ?? null
        }

        return null
    }

    /**
     * Met à jour les rôles de pp d'un membre
     * @param leaderboard nom du leaderboard (scoresaber | beatleader)
     * @param member membre Discord à mettre à jour
     * @param pp nombre de pp du membre
     */
    static async updateMemberPpRoles(
        leaderboard: Leaderboards,
        member: GuildMember,
        pp: number
    ) {
        const ldRoles =
            leaderboard === Leaderboards.ScoreSaber
                ? config.guild.roles.pp.scoresaber
                : config.guild.roles.pp.beatleader
        const memberPpRoles = this.getMemberPpRoles(leaderboard, member)

        // On détermine la liste des rôles de pp à assigner au membre
        const t = Math.floor(pp / 1000)
        const h = pp % 1000 > 500
        const newPpRoles = [
            Intl.NumberFormat('en-US')
                .format(t * 1000)
                .replace(',', ' ') + 'pp'
        ]
        if (h)
            newPpRoles.push(
                Intl.NumberFormat('en-US')
                    .format(t * 1000 + 500)
                    .replace(',', ' ') + 'pp'
            )

        const oldPpRoles = memberPpRoles.map((m) => m.name)

        // Si l'utilisateur n'a pas déjà les bons rôles, on met à jour ceux-ci
        if (
            !(
                oldPpRoles.length === newPpRoles.length &&
                oldPpRoles.every((m, i) => m === newPpRoles[i])
            )
        ) {
            // Liste des rôles du serveur
            const roles = await member.guild.roles.fetch()

            // Suppression des rôles de pp au membre
            for (const [, role] of memberPpRoles) {
                const roleSearch = newPpRoles.indexOf(role.name)
                // Si le rôle de pp à ajouter est déjà attribué au membre, on le conserve
                if (roleSearch !== -1) {
                    newPpRoles.splice(roleSearch, 1)
                } else {
                    // Sinon, on le supprime
                    const roleId = this.ldRoleExists(role.name, ldRoles)
                        ? ldRoles[role.name]
                        : null
                    const roleToDelete = roleId
                        ? roles.find((r) => r.id === roleId)
                        : null
                    if (roleToDelete) await member.roles.remove(roleToDelete)
                }
            }

            // Ajout des rôles de pp au membre
            for (const roleName of newPpRoles) {
                const roleId = this.ldRoleExists(roleName, ldRoles)
                    ? ldRoles[roleName]
                    : null
                const roleToAdd = roleId
                    ? roles.find((r) => r.id === roleId)
                    : null
                if (roleToAdd) await member.roles.add(roleToAdd)
            }
        }
    }
}
