import { PlayerModel } from '../models/player.model.js'
import { Leaderboards } from './gameLeaderboard.js'
import { PlayerData } from '../interfaces/player.interface.js'
import { PlayerError } from '../utils/error.js'

export default class Players {
    /**
     * Récupère un joueur depuis la table « players »
     * @param memberId identifiant Discord du membre
     * @param leaderboardName nom du leaderboard
     * @returns informations du joueur
     */
    static async get(memberId: string, leaderboardName: Leaderboards) {
        return await PlayerModel.findOne({
            where: { memberId: memberId, leaderboard: leaderboardName }
        })
    }

    /**
     * Ajoute un joueur dans la table « players »
     * @param memberId identifiant Discord du membre
     * @param playerData données du profil leaderboard du membre
     * @param leaderboardName nom du leaderboard
     * @param isAdmin indique si il s'agit d'un admin/modérateur qui a exécuté la commande
     */
    static async add(
        memberId: string,
        playerData: PlayerData,
        leaderboardName: Leaderboards,
        isAdmin: boolean = false
    ) {
        if (!isAdmin) {
            // On vérifie si le membre Discord à déjà un profil de lié pour le leaderboard choisi
            const profileIsAlreadyLinked = await PlayerModel.count({
                where: { memberId: memberId, leaderboard: leaderboardName }
            })
            if (profileIsAlreadyLinked > 0)
                throw new PlayerError(
                    `Ce compte Discord est déjà lié à un profil ${leaderboardName}\nVeuillez utiliser la commande \`/unlink\` avant de lier un autre profil\n(Cette commande peut être utilisée dans la limite de 1 par mois)`
                )
        }

        // On vérifie si le profil pour le leaderboard choisi est déjà lié à un membre Discord
        const player = await PlayerModel.findOne({
            where: { playerId: playerData.id, leaderboard: leaderboardName }
        })

        if (!player) {
            const p = await PlayerModel.create({
                leaderboard: leaderboardName,
                memberId: memberId,
                playerId: playerData.id,
                playerName: playerData.name,
                playerCountry: playerData.country,
                points: playerData.points,
                rank: playerData.rank,
                countryRank: playerData.countryRank,
                averageRankedAccuracy: playerData.averageRankedAccuracy,
                serverRankAcc: 0,
                serverRankPoints: 0,
                topScore: playerData.topScore,
                top1: leaderboardName === Leaderboards.ScoreSaber
            })

            const playerServerRanking = await this.getPlayerServerRanking(
                leaderboardName,
                playerData.id
            )
            p.serverRankAcc = playerServerRanking.serverRankAcc
            p.serverRankPoints = playerServerRanking.serverRankPoints
            await p.save()
        } else {
            await this.update(memberId, leaderboardName, playerData)
        }
    }

    /**
     * Mise à jour d'un joueur
     * @param memberId identifiant Discord du membre
     * @param leaderboardName nom du leaderboard
     * @param playerData données du profil ScoreSaber ou BeatLeader du joueur
     * @param playerRanking données de classement serveur du joueur
     * @returns informations du joueur
     */
    static async update(
        memberId: string,
        leaderboardName: Leaderboards,
        playerData: PlayerData
    ) {
        const player = (await PlayerModel.findOne({
            where: { memberId: memberId, leaderboard: leaderboardName }
        })) as PlayerModel

        player.playerId = playerData.id
        player.playerName = playerData.name
        player.playerCountry = playerData.country ?? null
        player.points = playerData.points
        if (!playerData.inactive) {
            player.rank = playerData.rank
            player.countryRank = playerData.countryRank ?? null
        }
        player.averageRankedAccuracy = playerData.averageRankedAccuracy
        ;((player.serverRankAcc = 0), (player.serverRankPoints = 0))
        player.topScore = playerData.topScore
        await player.save()

        const playerServerRanking = await this.getPlayerServerRanking(
            leaderboardName,
            playerData.id
        )
        player.serverRankAcc = playerServerRanking.serverRankAcc
        player.serverRankPoints = playerServerRanking.serverRankPoints
        await player.save()

        return player
    }

    /**
     * Suppression des données d'un joueur
     * @param memberId identifiant Discord du membre
     */
    static async remove(memberId: string, leaderboardChoice: Leaderboards) {
        await PlayerModel.destroy({
            where: { memberId: memberId, leaderboard: leaderboardChoice }
        })
    }

    /**
     * Récupération du classement serveur d'un joueur
     * @param leaderboardName choix du leaderboard
     * @param playerId identifiant joueur
     * @returns classement serveur du joueur
     */
    static async getPlayerServerRanking(
        leaderboardName: Leaderboards,
        playerId: string
    ) {
        // Récupération du classement
        const p = await PlayerModel.findAll({
            where: { leaderboard: leaderboardName },
            order: [['points', 'ASC']]
        })

        // Récupération des rangs Discord du membre
        const serverRankPoints = p
            .sort((a, b) => b.points - a.points)
            .findIndex(
                (ld) =>
                    ld.playerId === playerId &&
                    ld.leaderboard === leaderboardName
            )
        const serverRankAcc = p
            .sort((a, b) => b.averageRankedAccuracy - a.averageRankedAccuracy)
            .findIndex(
                (ld) =>
                    ld.playerId === playerId &&
                    ld.leaderboard === leaderboardName
            )

        return {
            serverRankPoints: serverRankPoints + 1,
            serverRankAcc: serverRankAcc + 1,
            serverLdTotal: p.length
        }
    }
}
