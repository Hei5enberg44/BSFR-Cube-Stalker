export interface components {
    schemas: {
        MapDetail: {
            automapper: boolean;
            bookmarked: boolean;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            curatedAt: string;
            curator: components["schemas"]["UserDetail"];
            /** Format: date-time */
            deletedAt: string;
            description: string;
            id: string;
            /** Format: date-time */
            lastPublishedAt: string;
            metadata: components["schemas"]["MapDetailMetadata"];
            name: string;
            qualified: boolean;
            ranked: boolean;
            stats: components["schemas"]["MapStats"];
            tags: "None" | "Tech" | "DanceStyle" | "Speed" | "Balanced" | "Challenge" | "Accuracy" | "Fitness" | "Swing" | "Nightcore" | "Folk" | "Family" | "Ambient" | "Funk" | "Jazz" | "Classical" | "Soul" | "Speedcore" | "Punk" | "RB" | "Holiday" | "Vocaloid" | "JRock" | "Trance" | "DrumBass" | "Comedy" | "Instrumental" | "Hardcore" | "KPop" | "Indie" | "Techno" | "House" | "Game" | "Film" | "Alt" | "Dubstep" | "Metal" | "Anime" | "HipHop" | "JPop" | "Dance" | "Rock" | "Pop" | "Electronic";
            /** Format: date-time */
            updatedAt: string;
            /** Format: date-time */
            uploaded: string;
            uploader: components["schemas"]["UserDetail"];
            versions: (components["schemas"]["MapVersion"])[];
        };
        UserDetail: {
            admin: boolean;
            avatar: string;
            curator: boolean;
            description: string;
            email: string;
            followData: components["schemas"]["UserFollowData"];
            hash: string;
            /** Format: int32 */
            id: number;
            name: string;
            playlistUrl: string;
            stats: components["schemas"]["UserStats"];
            /** Format: date-time */
            suspendedAt: string;
            testplay: boolean;
            type: "DISCORD" | "SIMPLE" | "DUAL";
            uniqueSet: boolean;
            /** Format: int32 */
            uploadLimit: number;
            verifiedMapper: boolean;
        };
        UserFollowData: {
            /** Format: int32 */
            followers: number;
            following: boolean;
            /** Format: int32 */
            follows: number;
        };
        UserStats: {
            /** Format: float */
            avgBpm: number;
            /** Format: float */
            avgDuration: number;
            /** Format: float */
            avgScore: number;
            diffStats: components["schemas"]["UserDiffStats"];
            /** Format: date-time */
            firstUpload: string;
            /** Format: date-time */
            lastUpload: string;
            /** Format: int32 */
            rankedMaps: number;
            /** Format: int32 */
            totalDownvotes: number;
            /** Format: int32 */
            totalMaps: number;
            /** Format: int32 */
            totalUpvotes: number;
        };
        UserDiffStats: {
            /** Format: int32 */
            easy: number;
            /** Format: int32 */
            expert: number;
            /** Format: int32 */
            expertPlus: number;
            /** Format: int32 */
            hard: number;
            /** Format: int32 */
            normal: number;
            /** Format: int32 */
            total: number;
        };
        MapDetailMetadata: {
            /** Format: float */
            bpm: number;
            /** Format: int32 */
            duration: number;
            levelAuthorName: string;
            songName: string;
            songSubName: string;
        };
        MapStats: {
            /** Format: int32 */
            downloads: number;
            /** Format: int32 */
            downvotes: number;
            /** Format: int32 */
            plays: number;
            /** Format: int32 */
            reviews: number;
            /** Format: float */
            score: number;
            /** Format: float */
            scoreOneDP: number;
            sentiment: "PENDING" | "VERY_NEGATIVE" | "MOSTLY_NEGATIVE" | "MIXED" | "MOSTLY_POSITIVE" | "VERY_POSITIVE";
            /** Format: int32 */
            upvotes: number;
        };
        MapVersion: {
            coverURL: string;
            /** Format: date-time */
            createdAt: string;
            diffs: (components["schemas"]["MapDifficulty"])[];
            downloadURL: string;
            feedback: string;
            hash: string;
            key: string;
            previewURL: string;
            sageScore: number;
            /** Format: date-time */
            scheduledAt: string;
            state: "Uploaded" | "Testplay" | "Published" | "Feedback" | "Scheduled";
            /** Format: date-time */
            testplayAt: string;
            testplays: (components["schemas"]["MapTestplay"])[];
        };
        MapDifficulty: {
            /** Format: int32 */
            bombs: number;
            characteristic: "Standard" | "OneSaber" | "NoArrows" | "90Degree" | "360Degree" | "Lightshow" | "Lawless";
            chroma: boolean;
            cinema: boolean;
            difficulty: "Easy" | "Normal" | "Hard" | "Expert" | "ExpertPlus";
            /** Format: int32 */
            events: number;
            label: string;
            /** Format: double */
            length: number;
            /** Format: int32 */
            maxScore: number;
            me: boolean;
            ne: boolean;
            /** Format: float */
            njs: number;
            /** Format: int32 */
            notes: number;
            /** Format: double */
            nps: number;
            /** Format: int32 */
            obstacles: number;
            /** Format: float */
            offset: number;
            paritySummary: components["schemas"]["MapParitySummary"];
            /** Format: double */
            seconds: number;
            /** Format: float */
            stars: number;
        };
        MapParitySummary: {
            /** Format: int32 */
            errors: number;
            /** Format: int32 */
            resets: number;
            /** Format: int32 */
            warns: number;
        };
        MapTestplay: {
            /** Format: date-time */
            createdAt: string;
            feedback: string;
            /** Format: date-time */
            feedbackAt: string;
            user: components["schemas"]["UserDetail"];
            video: string;
        };
        SearchResponse: {
            docs: (components["schemas"]["MapDetail"])[];
            redirect: string;
        };
        PlaylistSearchResponse: {
            docs: (components["schemas"]["PlaylistFull"])[];
        };
        PlaylistFull: {
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            curatedAt: string;
            curator: components["schemas"]["UserDetail"];
            /** Format: date-time */
            deletedAt: string;
            description: string;
            downloadURL: string;
            name: string;
            owner: components["schemas"]["UserDetail"];
            /** Format: int32 */
            playlistId: number;
            playlistImage: string;
            playlistImage512: string;
            /** Format: date-time */
            songsChangedAt: string;
            stats: components["schemas"]["PlaylistStats"];
            type: "Private" | "Public" | "System";
            /** Format: date-time */
            updatedAt: string;
        };
        PlaylistStats: {
            /** Format: float */
            avgScore: number;
            /** Format: int32 */
            downVotes: number;
            /** Format: int64 */
            mapperCount: number;
            /** Format: double */
            maxNps: number;
            /** Format: double */
            maxNpsTwoDP: number;
            /** Format: double */
            minNps: number;
            /** Format: double */
            minNpsTwoDP: number;
            /** Format: float */
            scoreOneDP: number;
            /** Format: int32 */
            totalDuration: number;
            /** Format: int32 */
            totalMaps: number;
            /** Format: int32 */
            upVotes: number;
        };
        PlaylistPage: {
            maps: (components["schemas"]["MapDetailWithOrder"])[];
            playlist: components["schemas"]["PlaylistFull"];
        };
        MapDetailWithOrder: {
            map: components["schemas"]["MapDetail"];
            /** Format: float */
            order: number;
        };
    };
}