export interface components {
    schemas: {
        Metadata: {
            total: number;
            page: number;
            itemsPerPage: number;
        };
        LeaderboardInfo: {
            id: number;
            songHash: string;
            songName: string;
            songSubName: string;
            songAuthorName: string;
            levelAuthorName: string;
            difficulty: components["schemas"]["Difficulty"];
            maxScore: number;
            /** Format: date-time */
            createdDate: string;
            rankedDate: string ;
            qualifiedDate: string;
            lovedDate: string;
            ranked: boolean;
            qualified: boolean;
            loved: boolean;
            maxPP: number;
            stars: number;
            positiveModifiers: boolean;
            plays: number;
            dailyPlays: number;
            coverImage: string;
            playerScore: components["schemas"]["Score"];
            difficulties: (components["schemas"]["Difficulty"])[];
        };
        LeaderboardInfoCollection: {
            leaderboards: (components["schemas"]["LeaderboardInfo"])[];
            metadata: components["schemas"]["Metadata"];
        };
        LeaderboardPlayer: {
            id: string;
            name: string;
            profilePicture: string;
            country: string;
            permissions: number;
            role: string;
        };
        Difficulty: {
            leaderboardId: number;
            difficulty: number;
            gameMode: string;
            difficultyRaw: string;
        };
        ScoreCollection: {
            scores: (components["schemas"]["Score"])[];
            metadata: components["schemas"]["Metadata"];
        };
        Score: {
            id: number;
            leaderboardPlayerInfo?: components["schemas"]["LeaderboardPlayer"];
            rank: number;
            baseScore: number;
            modifiedScore: number;
            pp: number;
            weight: number;
            modifiers: string;
            multiplier: number;
            badCuts: number;
            missedNotes: number;
            maxCombo: number;
            fullCombo: boolean;
            hmd: number;
            hasReplay: boolean;
            /** Format: date-time */
            timeSet: string;
        };
        PlayerCollection: {
            players: (components["schemas"]["Player"])[];
            metadata: components["schemas"]["Metadata"];
        };
        Player: {
            id: string;
            name: string;
            profilePicture: string;
            country: string;
            pp: number;
            rank: number;
            countryRank: number;
            role: string;
            badges: (components["schemas"]["Badge"])[];
            histories: string;
            scoreStats: components["schemas"]["ScoreStats"];
            permissions: number;
            banned: boolean;
            inactive: boolean;
        };
        ScoreStats: {
            totalScore: number;
            totalRankedScore: number;
            averageRankedAccuracy: number;
            totalPlayCount: number;
            rankedPlayCount: number;
            replaysWatched: number;
        };
        Badge: {
            description: string;
            image: string;
        };
        PlayerScoreCollection: {
            playerScores: (components["schemas"]["PlayerScore"])[];
            metadata: components["schemas"]["Metadata"];
        };
        PlayerScore: {
            score: components["schemas"]["Score"];
            leaderboard: components["schemas"]["LeaderboardInfo"];
        };
        VoteGroup: {
            upvotes: number;
            downvotes: number;
            myVote: boolean;
            neutral?: number;
        };
        RankRequestListing: {
            requestId: number;
            weight: number;
            leaderboardInfo: components["schemas"]["LeaderboardInfo"];
            created_at: string;
            totalRankVotes: components["schemas"]["VoteGroup"];
            totalQATVotes: components["schemas"]["VoteGroup"];
            difficultyCount: number;
        };
        RankRequestInformation: {
            requestId: number;
            requestDescription: string;
            leaderboardInfo: components["schemas"]["LeaderboardInfo"];
            created_at: string;
            rankVotes: components["schemas"]["VoteGroup"];
            qatVotes: components["schemas"]["VoteGroup"];
            rankComments: (components["schemas"]["Comment"])[];
            qatComments: (components["schemas"]["Comment"])[];
            requestType: number;
            approved: number;
            difficulties: (components["schemas"]["RankingDifficulty"])[];
        };
        RankingDifficulty: {
            requestId: number;
            difficulty: number;
        };
        Comment: {
            username: string;
            userId: string;
            comment: string;
            timeStamp: string;
        };
        UserData: {
            playerId: string;
            permissions: number;
            questKey: string;
        };
    };
}