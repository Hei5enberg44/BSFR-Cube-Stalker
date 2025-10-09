export interface components {
    schemas: {
        Achievement: {
            /** Format: int32 */
            id: number
            playerId: string | null
            player: components['schemas']['Player']
            /** Format: int32 */
            achievementDescriptionId: number
            achievementDescription: components['schemas']['AchievementDescription']
            level: components['schemas']['AchievementLevel']
            /** Format: int32 */
            timeset: number
            /** Format: int32 */
            count: number
        }
        AchievementDescription: {
            /** Format: int32 */
            id: number
            name: string | null
            description: string | null
            link: string | null
            achievements: components['schemas']['Achievement'][] | null
            levels: components['schemas']['AchievementLevel'][] | null
        }
        AchievementLevel: {
            /** Format: int32 */
            id: number
            image: string | null
            smallImage: string | null
            name: string | null
            description: string | null
            detailedDescription: string | null
            color: string | null
            /** Format: float */
            value: number | null
            /** Format: int32 */
            level: number
            /** Format: int32 */
            achievementDescriptionId: number
        }
        AveragePosition: {
            /** Format: float */
            x: number
            /** Format: float */
            y: number
            /** Format: float */
            z: number
        }
        Badge: {
            /** Format: int32 */
            id: number
            description: string | null
            image: string | null
            link: string | null
        }
        Ban: {
            /** Format: int32 */
            id: number
            playerId: string
            bannedBy: string
            banReason: string
            /** Format: int32 */
            timeset: number
            /** Format: int32 */
            duration: number
        }
        BanReturn: {
            reason: string | null
            /** Format: int32 */
            timeset: number
            /** Format: int32 */
            duration: number
        }
        Clan: {
            /** Format: int32 */
            id: number
            name: string | null
            color: string | null
            icon: string | null
            tag: string | null
            leaderID: string | null
            description: string | null
            bio: string | null
            /** Format: int32 */
            playersCount: number
            /** Format: float */
            pp: number
            /** Format: float */
            averageRank: number
            /** Format: float */
            averageAccuracy: number
            players: components['schemas']['Player'][] | null
        }
        ClanResponse: {
            /** Format: int32 */
            id: number
            tag: string
            color: string
        }
        ClanResponseFull: {
            /** Format: int32 */
            id: number
            name: string | null
            color: string | null
            icon: string | null
            tag: string | null
            leaderID: string | null
            description: string | null
            bio: string | null
            richBio: string | null
            discordInvite: string | null
            /** Format: int32 */
            playersCount: number
            /** Format: float */
            pp: number
            /** Format: int32 */
            rank: number
            /** Format: float */
            averageRank: number
            /** Format: float */
            averageAccuracy: number
            /** Format: float */
            rankedPoolPercentCaptured: number
            /** Format: int32 */
            captureLeaderboardCount: number
            playerChangesCallback: string | null
            clanRankingDiscordHook: string | null
            featuredPlaylists:
                | components['schemas']['FeaturedPlaylistResponse'][]
                | null
        }
        ClanRankingResponse: {
            /** Format: int32 */
            id: number
            clan: components['schemas']['Clan']
            /** Format: int32 */
            lastUpdateTime: number
            /** Format: float */
            averageRank: number
            /** Format: int32 */
            rank: number
            /** Format: float */
            pp: number
            /** Format: float */
            averageAccuracy: number
            /** Format: float */
            totalScore: number
            leaderboardId: string | null
            leaderboard: components['schemas']['Leaderboard']
            associatedScores: components['schemas']['ScoreResponse'][] | null
            /** Format: int32 */
            associatedScoresCount: number
            myScore: components['schemas']['ScoreResponseWithAcc'] | null
        }
        ClanRankingResponseClanResponseFullResponseWithMetadataAndContainer: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['ClanRankingResponse'][] | null
            container: components['schemas']['ClanResponseFull']
        }
        DifficultyDescription: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            value: number
            /** Format: int32 */
            mode: number
            difficultyName: string
            modeName: string
            status: components['schemas']['DifficultyStatus']
            /** Format: int32 */
            nominatedTime: number
            /** Format: int32 */
            qualifiedTime: number
            /** Format: int32 */
            rankedTime: number
            /** Format: float */
            stars: number | null
            /** Format: int32 */
            type: number
            /** Format: float */
            njs: number
            /** Format: float */
            nps: number
            /** Format: int32 */
            notes: number
            /** Format: int32 */
            bombs: number
            /** Format: int32 */
            walls: number
            /** Format: int32 */
            maxScore: number
            /** Format: double */
            duration: number
        }
        /**
         * Format: int32
         * @enum {integer}
         */
        DifficultyStatus: 0 | 1 | 2 | 3 | 4 | 5 | 6
        /**
         * Format: int32
         * @enum {integer}
         */
        EndType: 0 | 1 | 2 | 3 | 4
        EventPlayer: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            eventId: number
            name: string
            playerId: string
            country: string
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            /** Format: float */
            pp: number
        }
        EventResponse: {
            /** Format: int32 */
            id: number
            name: string | null
            /** Format: int32 */
            endDate: number
            /** Format: int32 */
            playlistId: number
            image: string | null
            /** Format: int32 */
            playerCount: number
            leader: components['schemas']['PlayerResponse']
        }
        EventResponseResponseWithMetadata: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['EventResponse'][] | null
        }
        FailedScore: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            baseScore: number
            /** Format: int32 */
            modifiedScore: number
            /** Format: float */
            accuracy: number
            playerId: string | null
            /** Format: float */
            pp: number
            /** Format: float */
            weight: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            replay: string | null
            modifiers: string | null
            /** Format: int32 */
            badCuts: number
            /** Format: int32 */
            missedNotes: number
            /** Format: int32 */
            bombCuts: number
            /** Format: int32 */
            wallsHit: number
            /** Format: int32 */
            pauses: number
            fullCombo: boolean
            hmd: components['schemas']['HMD']
            timeset: string | null
            player: components['schemas']['Player']
            leaderboard: components['schemas']['Leaderboard']
            error: string | null
        }
        FailedScoreResponseWithMetadata: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['FailedScore'][] | null
        }
        FeaturedPlaylistResponse: {
            /** Format: int32 */
            id: number
            playlistLink: string | null
            cover: string | null
            title: string | null
            description: string | null
            owner: string | null
            ownerCover: string | null
            ownerLink: string | null
        }
        FriendActivity: {
            player: components['schemas']['PlayerResponse']
            type: components['schemas']['FriendActivityType']
            activityObject: Record<string, unknown> | null
        }
        FriendActivityResponseWithMetadata: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['FriendActivity'][] | null
        }
        /**
         * Format: int32
         * @enum {integer}
         */
        FriendActivityType: 1 | 2 | 3 | 4
        GraphResponse: {
            leaderboardId: string | null
            diff: string | null
            mode: string | null
            modifiers: string | null
            songName: string | null
            mapper: string | null
            /** Format: float */
            acc: number
            timeset: string | null
            /** Format: float */
            stars: number
        }
        /**
         * Format: int32
         * @enum {integer}
         */
        HMD:
            | 0
            | 1
            | 2
            | 4
            | 8
            | 16
            | 32
            | 33
            | 34
            | 35
            | 36
            | 37
            | 38
            | 39
            | 40
            | 41
            | 42
            | 43
            | 44
            | 45
            | 46
            | 47
            | 48
            | 49
            | 50
            | 51
            | 52
            | 53
            | 54
            | 55
            | 56
            | 57
            | 58
            | 59
            | 60
            | 61
            | 62
            | 63
            | 64
            | 65
            | 128
            | 256
        HitTracker: {
            /** Format: int32 */
            maxCombo: number
            /** Format: int32 */
            maxStreak: number
            /** Format: float */
            leftTiming: number
            /** Format: float */
            rightTiming: number
            /** Format: int32 */
            leftMiss: number
            /** Format: int32 */
            rightMiss: number
            /** Format: int32 */
            leftBadCuts: number
            /** Format: int32 */
            rightBadCuts: number
            /** Format: int32 */
            leftBombs: number
            /** Format: int32 */
            rightBombs: number
        }
        Leaderboard: {
            id: string | null
            songId: string | null
            song: components['schemas']['Song']
            difficulty: components['schemas']['DifficultyDescription']
            scores: components['schemas']['Score'][] | null
            /** Format: int64 */
            timestamp: number
            playerStats:
                | components['schemas']['PlayerLeaderboardStats'][]
                | null
            /** Format: int32 */
            plays: number
            /** Format: int32 */
            playCount: number
            /** Format: int32 */
            positiveVotes: number
            /** Format: int32 */
            starVotes: number
            /** Format: int32 */
            negativeVotes: number
            /** Format: float */
            voteStars: number
        }
        LeaderboardInfoResponse: {
            id: string | null
            song: components['schemas']['Song']
            difficulty: components['schemas']['DifficultyDescription']
            /** Format: int32 */
            plays: number
            /** Format: int32 */
            positiveVotes: number
            /** Format: int32 */
            starVotes: number
            /** Format: int32 */
            negativeVotes: number
            /** Format: float */
            voteStars: number
            myScore: components['schemas']['ScoreResponseWithAcc']
        }
        LeaderboardInfoResponseResponseWithMetadata: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['LeaderboardInfoResponse'][] | null
        }
        LeaderboardResponse: {
            id: string
            song: components['schemas']['Song']
            difficulty: components['schemas']['DifficultyDescription']
            scores: components['schemas']['ScoreResponse'][] | null
            /** Format: int32 */
            plays: number
        }
        LeaderboardVoting: {
            /** Format: float */
            rankability: number
            /** Format: float */
            stars: number
            type: number[] | null
        }
        LeaderboardsInfoResponse: {
            id: string | null
            difficulty: components['schemas']['DifficultyDescription']
        }
        LeaderboardsResponse: {
            song: components['schemas']['Song']
            leaderboards:
                | components['schemas']['LeaderboardsInfoResponse'][]
                | null
        }
        Metadata: {
            /** Format: int32 */
            itemsPerPage: number
            /** Format: int32 */
            page: number
            /** Format: int32 */
            total: number
        }
        PatreonFeatures: {
            /** Format: int32 */
            id: number
            bio: string
            message: string
            leftSaberColor: string
            rightSaberColor: string
        }
        Player: {
            id: string
            name: string
            platform: string
            avatar: string
            country: string
            role: string
            /** Format: int32 */
            mapperId: number
            /** Format: float */
            pp: number
            /** Format: float */
            accPp: number
            /** Format: float */
            techPp: number
            /** Format: float */
            passPp: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            /** Format: float */
            lastWeekPp: number
            /** Format: int32 */
            lastWeekRank: number
            /** Format: int32 */
            lastWeekCountryRank: number
            banned: boolean
            inactive: boolean
            externalProfileUrl: string
            scoreStats: components['schemas']['PlayerScoreStats']
            clans: components['schemas']['Clan'][]
            friends: components['schemas']['PlayerFriends'][] | null
            badges: components['schemas']['Badge'][] | null
            patreonFeatures: components['schemas']['PatreonFeatures'] | null
            profileSettings: components['schemas']['ProfileSettings']
            changes: components['schemas']['PlayerChange'][] | null
            history: components['schemas']['PlayerScoreStatsHistory'][] | null
            eventsParticipating: components['schemas']['EventPlayer'][] | null
            socials: components['schemas']['PlayerSocial'][] | null
            achievements: components['schemas']['Achievement'][] | null
        }
        PlayerChange: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            timestamp: number
            playerId: string
            oldName: string
            newName: string
            oldCountry: string
            newCountry: string | null
            changer: string | null
        }
        PlayerFriends: {
            id: string | null
            friends: components['schemas']['Player'][] | null
        }
        PlayerLeaderboardStats: {
            /** Format: int32 */
            id: number
            playerId: string | null
            type: components['schemas']['EndType']
            /** Format: int32 */
            timeset: number
            /** Format: float */
            time: number
            /** Format: int32 */
            score: number
            leaderboardId: string | null
            leaderboard: components['schemas']['Leaderboard']
        }
        PlayerLeaderboardStatsResponseWithMetadata: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['PlayerLeaderboardStats'][] | null
        }
        PlayerResponse: {
            id: string
            name: string
            platform: string
            avatar: string
            country: string
            /** Format: float */
            pp: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            role: string
            socials: components['schemas']['PlayerSocial'][]
            patreonFeatures: components['schemas']['PatreonFeatures'] | null
            profileSettings: components['schemas']['ProfileSettings']
            clans: components['schemas']['ClanResponse'][]
        }
        PlayerResponseFull: {
            id: string
            name: string
            platform: string
            avatar: string
            country: string
            /** Format: float */
            pp: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            role: string
            socials: components['schemas']['PlayerSocial'][]
            patreonFeatures: components['schemas']['PatreonFeatures'] | null
            profileSettings: components['schemas']['ProfileSettings']
            clans: components['schemas']['ClanResponse'][]
            /** Format: float */
            accPp: number
            /** Format: float */
            passPp: number
            /** Format: float */
            techPp: number
            scoreStats: components['schemas']['PlayerScoreStats']
            /** Format: float */
            lastWeekPp: number
            /** Format: int32 */
            lastWeekRank: number
            /** Format: int32 */
            lastWeekCountryRank: number
            eventsParticipating: components['schemas']['EventPlayer'][]
            /** Format: int32 */
            mapperId: number
            banned: boolean
            inactive: boolean
            externalProfileUrl: string
            history: components['schemas']['PlayerScoreStatsHistory'][] | null
            badges: components['schemas']['Badge'][]
            changes: components['schemas']['PlayerChange'][]
        }
        PlayerResponseWithFriends: {
            id: string | null
            name: string | null
            platform: string | null
            avatar: string | null
            country: string | null
            /** Format: float */
            pp: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            role: string | null
            socials: components['schemas']['PlayerSocial'][] | null
            patreonFeatures: components['schemas']['PatreonFeatures']
            profileSettings: components['schemas']['ProfileSettings']
            clans: components['schemas']['ClanResponse'][] | null
            friends: string[] | null
        }
        PlayerResponseWithStats: {
            id: string | null
            name: string | null
            platform: string | null
            avatar: string | null
            country: string | null
            /** Format: float */
            pp: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            role: string | null
            socials: components['schemas']['PlayerSocial'][] | null
            patreonFeatures: components['schemas']['PatreonFeatures']
            profileSettings: components['schemas']['ProfileSettings']
            clans: components['schemas']['ClanResponse'][] | null
            /** Format: float */
            accPp: number
            /** Format: float */
            passPp: number
            /** Format: float */
            techPp: number
            scoreStats: components['schemas']['PlayerScoreStats']
            /** Format: float */
            lastWeekPp: number
            /** Format: int32 */
            lastWeekRank: number
            /** Format: int32 */
            lastWeekCountryRank: number
            eventsParticipating: components['schemas']['EventPlayer'][] | null
        }
        PlayerResponseWithStatsResponseWithMetadata: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['PlayerResponseWithStats'][] | null
        }
        PlayerResponseClanResponseFullResponseWithMetadataAndContainer: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['PlayerResponse'][] | null
            container: components['schemas']['ClanResponseFull']
        }
        PlayerScoreStats: {
            /** Format: int32 */
            id: number
            /** Format: int64 */
            totalScore: number
            /** Format: int64 */
            totalUnrankedScore: number
            /** Format: int64 */
            totalRankedScore: number
            /** Format: int32 */
            lastScoreTime: number
            /** Format: int32 */
            lastUnrankedScoreTime: number
            /** Format: int32 */
            lastRankedScoreTime: number
            /** Format: float */
            averageRankedAccuracy: number
            /** Format: float */
            averageWeightedRankedAccuracy: number
            /** Format: float */
            averageUnrankedAccuracy: number
            /** Format: float */
            averageAccuracy: number
            /** Format: float */
            medianRankedAccuracy: number
            /** Format: float */
            medianAccuracy: number
            /** Format: float */
            topRankedAccuracy: number
            /** Format: float */
            topUnrankedAccuracy: number
            /** Format: float */
            topAccuracy: number
            /** Format: float */
            topPp: number
            /** Format: float */
            topBonusPP: number
            /** Format: float */
            topPassPP: number
            /** Format: float */
            topAccPP: number
            /** Format: float */
            topTechPP: number
            /** Format: float */
            peakRank: number
            /** Format: int32 */
            rankedMaxStreak: number
            /** Format: int32 */
            unrankedMaxStreak: number
            /** Format: int32 */
            maxStreak: number
            /** Format: float */
            averageLeftTiming: number
            /** Format: float */
            averageRightTiming: number
            /** Format: int32 */
            rankedPlayCount: number
            /** Format: int32 */
            unrankedPlayCount: number
            /** Format: int32 */
            totalPlayCount: number
            /** Format: float */
            averageRankedRank: number
            /** Format: float */
            averageWeightedRankedRank: number
            /** Format: float */
            averageUnrankedRank: number
            /** Format: float */
            averageRank: number
            /** Format: int32 */
            sspPlays: number
            /** Format: int32 */
            ssPlays: number
            /** Format: int32 */
            spPlays: number
            /** Format: int32 */
            sPlays: number
            /** Format: int32 */
            aPlays: number
            /** Format: int32 */
            dailyImprovements: number
            /** Format: int32 */
            authorizedReplayWatched: number
            /** Format: int32 */
            anonimusReplayWatched: number
            /** Format: int32 */
            watchedReplays: number
        }
        PlayerScoreStatsHistory: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            timestamp: number
            playerId: string
            /** Format: float */
            pp: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            /** Format: int64 */
            totalScore: number
            /** Format: int64 */
            totalUnrankedScore: number
            /** Format: int64 */
            totalRankedScore: number
            /** Format: int32 */
            lastScoreTime: number
            /** Format: int32 */
            lastUnrankedScoreTime: number
            /** Format: int32 */
            lastRankedScoreTime: number
            /** Format: float */
            averageRankedAccuracy: number
            /** Format: float */
            averageWeightedRankedAccuracy: number
            /** Format: float */
            averageUnrankedAccuracy: number
            /** Format: float */
            averageAccuracy: number
            /** Format: float */
            medianRankedAccuracy: number
            /** Format: float */
            medianAccuracy: number
            /** Format: float */
            topRankedAccuracy: number
            /** Format: float */
            topUnrankedAccuracy: number
            /** Format: float */
            topAccuracy: number
            /** Format: float */
            topPp: number
            /** Format: float */
            topBonusPP: number
            /** Format: float */
            peakRank: number
            /** Format: int32 */
            maxStreak: number
            /** Format: float */
            averageLeftTiming: number
            /** Format: float */
            averageRightTiming: number
            /** Format: int32 */
            rankedPlayCount: number
            /** Format: int32 */
            unrankedPlayCount: number
            /** Format: int32 */
            totalPlayCount: number
            /** Format: float */
            averageRankedRank: number
            /** Format: float */
            averageWeightedRankedRank: number
            /** Format: float */
            averageUnrankedRank: number
            /** Format: float */
            averageRank: number
            /** Format: int32 */
            sspPlays: number
            /** Format: int32 */
            ssPlays: number
            /** Format: int32 */
            spPlays: number
            /** Format: int32 */
            sPlays: number
            /** Format: int32 */
            aPlays: number
            /** Format: int32 */
            dailyImprovements: number
            /** Format: int32 */
            replaysWatched: number
            /** Format: int32 */
            watchedReplays: number
        }
        PlayerSocial: {
            /** Format: int32 */
            id: number
            service: string
            link: string
            user: string
            userId: string
            playerId: string
        }
        Playlist: {
            /** Format: int32 */
            id: number
            isShared: boolean
            link: string | null
            ownerId: string | null
        }
        PrevQualification: {
            /** Format: int32 */
            time: number
        }
        ProfanityCheckResult: {
            type: string | null
            intensity: string | null
            value: string | null
            line: string | null
        }
        ProfileSettings: {
            /** Format: int32 */
            id: number
            bio: string | null
            message: string | null
            effectName: string
            profileAppearance: string
            /** Format: float */
            hue: number | null
            /** Format: float */
            saturation: number | null
            leftSaberColor: string | null
            rightSaberColor: string | null
            profileCover: string | null
            starredFriends: string
            showBots: boolean
            showAllRatings: boolean
        }
        ReplayOffsets: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            frames: number
            /** Format: int32 */
            notes: number
            /** Format: int32 */
            walls: number
            /** Format: int32 */
            heights: number
            /** Format: int32 */
            pauses: number
        }
        SaverScoreResponse: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            baseScore: number
            /** Format: int32 */
            modifiedScore: number
            /** Format: float */
            accuracy: number
            /** Format: float */
            pp: number
            /** Format: int32 */
            rank: number
            modifiers: string | null
            leaderboardId: string | null
            timeset: string | null
            /** Format: int32 */
            timepost: number
            player: string | null
        }
        SaverScoreResponseResponseWithMetadata: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['SaverScoreResponse'][] | null
        }
        Score: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            baseScore: number
            /** Format: int32 */
            modifiedScore: number
            /** Format: float */
            accuracy: number
            playerId: string | null
            /** Format: float */
            pp: number
            /** Format: float */
            bonusPp: number
            /** Format: float */
            passPP: number
            /** Format: float */
            accPP: number
            /** Format: float */
            techPP: number
            qualification: boolean
            /** Format: float */
            weight: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            replay: string | null
            modifiers: string | null
            /** Format: int32 */
            badCuts: number
            /** Format: int32 */
            missedNotes: number
            /** Format: int32 */
            bombCuts: number
            /** Format: int32 */
            wallsHit: number
            /** Format: int32 */
            pauses: number
            fullCombo: boolean
            /** Format: int32 */
            maxCombo: number
            /** Format: float */
            fcAccuracy: number
            /** Format: float */
            fcPp: number
            /** Format: float */
            accRight: number
            /** Format: float */
            accLeft: number
            timeset: string | null
            /** Format: int32 */
            timepost: number
            platform: string | null
            player: components['schemas']['Player']
            leaderboardId: string | null
            leaderboard: components['schemas']['Leaderboard']
            /** Format: int32 */
            authorizedReplayWatched: number
            /** Format: int32 */
            anonimusReplayWatched: number
            replayOffsets: components['schemas']['ReplayOffsets']
            country: string | null
            /** Format: int32 */
            maxStreak: number
            /** Format: int32 */
            playCount: number
            /** Format: float */
            leftTiming: number
            /** Format: float */
            rightTiming: number
            banned: boolean
            suspicious: boolean
            ignoreForStats: boolean
            migrated: boolean
        }
        ScoreResponse: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            baseScore: number
            /** Format: int32 */
            modifiedScore: number
            /** Format: float */
            accuracy: number
            playerId: string
            /** Format: float */
            pp: number
            /** Format: float */
            bonusPp: number
            /** Format: float */
            passPP: number
            /** Format: float */
            accPP: number
            /** Format: float */
            techPP: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            country: string
            /** Format: float */
            fcAccuracy: number
            /** Format: float */
            fcPp: number
            /** Format: float */
            weight: number
            replay: string | null
            modifiers: string
            /** Format: int32 */
            badCuts: number
            /** Format: int32 */
            missedNotes: number
            /** Format: int32 */
            bombCuts: number
            /** Format: int32 */
            wallsHit: number
            /** Format: int32 */
            pauses: number
            fullCombo: boolean
            platform: string
            /** Format: int32 */
            maxCombo: number
            /** Format: int32 */
            maxStreak: number
            leaderboardId: string
            timeset: string
            /** Format: int32 */
            timepost: number
            /** Format: int32 */
            replaysWatched: number
            /** Format: int32 */
            playCount: number
            player: components['schemas']['PlayerResponse']
        }
        ScoreResponseResponseWithMetadataAndSelection: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['ScoreResponse'][] | null
            selection: components['schemas']['ScoreResponse']
        }
        ScoreResponseWithAcc: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            baseScore: number
            /** Format: int32 */
            modifiedScore: number
            /** Format: float */
            accuracy: number
            playerId: string
            /** Format: float */
            pp: number
            /** Format: float */
            bonusPp: number
            /** Format: float */
            passPP: number
            /** Format: float */
            accPP: number
            /** Format: float */
            techPP: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            country: string
            /** Format: float */
            fcAccuracy: number
            /** Format: float */
            fcPp: number
            replay: string | null
            modifiers: string
            /** Format: int32 */
            badCuts: number
            /** Format: int32 */
            missedNotes: number
            /** Format: int32 */
            bombCuts: number
            /** Format: int32 */
            wallsHit: number
            /** Format: int32 */
            pauses: number
            fullCombo: boolean
            platform: string
            /** Format: int32 */
            maxCombo: number
            /** Format: int32 */
            maxStreak: number
            leaderboardId: string
            timeset: string
            /** Format: int32 */
            timepost: number
            /** Format: int32 */
            replaysWatched: number
            /** Format: int32 */
            playCount: number
            player: components['schemas']['PlayerResponse']
            /** Format: float */
            weight: number
            /** Format: float */
            accLeft: number
            /** Format: float */
            accRight: number
        }
        ScoreResponseWithMyScore: {
            /** Format: int32 */
            id: number
            /** Format: int32 */
            baseScore: number
            /** Format: int32 */
            modifiedScore: number
            /** Format: float */
            accuracy: number
            playerId: string
            /** Format: float */
            pp: number
            /** Format: float */
            bonusPp: number
            /** Format: float */
            passPP: number
            /** Format: float */
            accPP: number
            /** Format: float */
            techPP: number
            /** Format: int32 */
            rank: number
            /** Format: int32 */
            countryRank: number
            country: string
            /** Format: float */
            fcAccuracy: number
            /** Format: float */
            fcPp: number
            replay: string | null
            modifiers: string
            /** Format: int32 */
            badCuts: number
            /** Format: int32 */
            missedNotes: number
            /** Format: int32 */
            bombCuts: number
            /** Format: int32 */
            wallsHit: number
            /** Format: int32 */
            pauses: number
            fullCombo: boolean
            platform: string
            /** Format: int32 */
            maxCombo: number
            /** Format: int32 */
            maxStreak: number
            leaderboardId: string
            timeset: string
            /** Format: int32 */
            timepost: number
            /** Format: int32 */
            replaysWatched: number
            /** Format: int32 */
            playCount: number
            player: components['schemas']['PlayerResponse']
            /** Format: float */
            weight: number
            /** Format: float */
            accLeft: number
            /** Format: float */
            accRight: number
            myScore: components['schemas']['ScoreResponseWithAcc'] | null
            leaderboard: components['schemas']['LeaderboardResponse']
        }
        ScoreResponseWithMyScoreResponseWithMetadata: {
            metadata: components['schemas']['Metadata']
            data: components['schemas']['ScoreResponseWithMyScore'][] | null
        }
        Song: {
            id: string
            hash: string
            name: string
            subName: string
            author: string
            mapper: string
            /** Format: int32 */
            mapperId: number
            coverImage: string
            fullCoverImage: string
            downloadUrl: string
            /** Format: double */
            bpm: number
            /** Format: double */
            duration: number
            tags: string | null
            /** Format: int32 */
            uploadTime: number
            difficulties:
                | components['schemas']['DifficultyDescription'][]
                | null
        }
    }
}
