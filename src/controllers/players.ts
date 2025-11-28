import { Leaderboards } from './gameLeaderboard.js'
import { PlayerData } from '../interfaces/player.interface.js'
import { PlayerError } from '../utils/error.js'
import { PlayerModel } from '../models/player.model.js'

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
            // On vérifie si le membre Discord à déjà un profil ScoreSaber ou BeatLeader lié
            const profileIsAlreadyLinked = await PlayerModel.count({
                where: { memberId: memberId, leaderboard: leaderboardName }
            })
            if (profileIsAlreadyLinked > 0)
                throw new PlayerError(
                    `Ce compte Discord est déjà lié à un profil ${leaderboardName === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'}\nVeuillez utiliser la commande \`/unlink\` avant de lier un autre profil\n(Cette commande peut être utilisée dans la limite de 1 par mois)`
                )
        }

        // On vérifie si le profil ScoreSaber ou BeatLeader est déjà lié à un membre Discord
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
                pp: playerData.pp,
                rank: playerData.rank,
                countryRank: playerData.countryRank,
                averageRankedAccuracy: playerData.averageRankedAccuracy,
                serverRankAcc: 0,
                serverRankPP: 0,
                topPP: playerData.topPP,
                top1: leaderboardName === Leaderboards.ScoreSaber
            })

            const playerServerRanking = await this.getPlayerServerRanking(
                leaderboardName,
                playerData.id
            )
            p.serverRankAcc = playerServerRanking.serverRankAcc
            p.serverRankPP = playerServerRanking.serverRankPP
            await p.save()
        } else {
            player.playerId = playerData.id
            player.playerName = playerData.name
            player.playerCountry = playerData.country
            player.pp = playerData.pp
            if(!playerData.inactive) {
                player.rank = playerData.rank
                player.countryRank = playerData.countryRank
            }
            player.averageRankedAccuracy = playerData.averageRankedAccuracy
            ;((player.serverRankAcc = 0), (player.serverRankPP = 0))
            player.topPP = playerData.topPP
            await player.save()

            const playerServerRanking = await this.getPlayerServerRanking(
                leaderboardName,
                playerData.id
            )
            player.serverRankAcc = playerServerRanking.serverRankAcc
            player.serverRankPP = playerServerRanking.serverRankPP
            await player.save()
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
        player.playerCountry = playerData.country
        player.pp = playerData.pp
        if(!playerData.inactive) {
            player.rank = playerData.rank
            player.countryRank = playerData.countryRank
        }
        player.averageRankedAccuracy = playerData.averageRankedAccuracy
        ;((player.serverRankAcc = 0), (player.serverRankPP = 0))
        player.topPP = playerData.topPP
        await player.save()

        const playerServerRanking = await this.getPlayerServerRanking(
            leaderboardName,
            playerData.id
        )
        player.serverRankAcc = playerServerRanking.serverRankAcc
        player.serverRankPP = playerServerRanking.serverRankPP
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
            order: [['pp', 'ASC']]
        })

        // Récupération des rangs Discord du membre
        const serverRankPP = p
            .sort((a, b) => b.pp - a.pp)
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
            serverRankPP: serverRankPP + 1,
            serverRankAcc: serverRankAcc + 1,
            serverLdTotal: p.length
        }
    }
}
