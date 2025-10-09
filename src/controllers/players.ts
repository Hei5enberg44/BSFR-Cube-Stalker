import leaderboard from './leaderboard.js'
import { Leaderboards } from './gameLeaderboard.js'
import { PlayerData, PlayerRanking } from '../interfaces/player.interface.js'
import { PlayerError } from '../utils/error.js'
import { PlayerModel } from '../models/player.model.js'
import { LeaderboardModel } from '../models/leaderboard.model.js'

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
     * @param playerId identifiant du profil leaderboard du membre
     * @param leaderboardName nom du leaderboard
     * @param isAdmin indique si il s'agit d'un admin/modérateur qui a exécuté la commande
     */
    static async add(
        memberId: string,
        playerId: string,
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
        const playerIsAlreadyLinked = await PlayerModel.count({
            where: { playerId: playerId, leaderboard: leaderboardName }
        })
        if (playerIsAlreadyLinked > 0)
            throw new PlayerError(
                `Ce profil ${leaderboardName === Leaderboards.ScoreSaber ? 'ScoreSaber' : 'BeatLeader'} est déjà relié à un compte Discord`
            )

        await leaderboard.removePlayerLeaderboard(leaderboardName, playerId)

        const player = await PlayerModel.findOne({
            where: { playerId: playerId, leaderboard: leaderboardName }
        })

        if (!player) {
            PlayerModel.create({
                leaderboard: leaderboardName,
                memberId: memberId,
                playerId: playerId,
                top1: leaderboardName === Leaderboards.ScoreSaber
            })
        } else {
            player.playerId = playerId
            player.playerName = null
            player.playerCountry = null
            player.pp = null
            player.rank = null
            player.countryRank = null
            player.averageRankedAccuracy = null
            player.serverRankAcc = null
            player.serverRankPP = null
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
        playerData: PlayerData,
        playerRanking: PlayerRanking
    ) {
        const player = await PlayerModel.findOne({
            where: { memberId: memberId, leaderboard: leaderboardName }
        })

        if (player) {
            await PlayerModel.update(
                {
                    playerId: playerData.id,
                    playerName: playerData.name,
                    playerCountry: playerData.country,
                    pp: playerData.pp,
                    rank: playerData.rank,
                    countryRank: playerData.countryRank,
                    averageRankedAccuracy: playerData.averageRankedAccuracy,
                    serverRankPP: playerRanking.serverRankPP,
                    serverRankAcc: playerRanking.serverRankAcc
                },
                { where: { memberId: memberId, leaderboard: leaderboardName } }
            )
        }

        return this.get(memberId, leaderboardName)
    }

    /**
     * Suppression des données d'un joueur
     * @param memberId identifiant Discord du membre
     */
    static async remove(memberId: string, leaderboardChoice: Leaderboards) {
        const where = { memberId: memberId, leaderboard: leaderboardChoice }

        await PlayerModel.destroy({ where })
        await LeaderboardModel.destroy({ where })
    }
}
