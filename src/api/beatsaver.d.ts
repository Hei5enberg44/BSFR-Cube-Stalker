export interface MapDetail {
    automapper: boolean
    blQualified: boolean
    blRanked: boolean
    bookmarked: boolean
    collaborators?: UserDetail[]
    /** @format date-time */
    createdAt: string
    /** @format date-time */
    curatedAt?: string
    /** UserDetail */
    curator?: UserDetail
    declaredAi: 'Admin' | 'Uploader' | 'SageScore' | 'None'
    /** @format date-time */
    deletedAt?: string
    description: string
    id: string
    /** @format date-time */
    lastPublishedAt: string
    /** MapDetailMetadata */
    metadata: MapDetailMetadata
    name: string
    qualified: boolean
    ranked: boolean
    /** MapStats */
    stats: MapStats
    tags?: (
        | 'None'
        | 'Tech'
        | 'DanceStyle'
        | 'Speed'
        | 'Balanced'
        | 'Challenge'
        | 'Accuracy'
        | 'Fitness'
        | 'Swing'
        | 'Nightcore'
        | 'Folk'
        | 'Family'
        | 'Ambient'
        | 'Funk'
        | 'Jazz'
        | 'Classical'
        | 'Soul'
        | 'Speedcore'
        | 'Punk'
        | 'RB'
        | 'Holiday'
        | 'Vocaloid'
        | 'JRock'
        | 'Trance'
        | 'DrumBass'
        | 'Comedy'
        | 'Instrumental'
        | 'Hardcore'
        | 'KPop'
        | 'Indie'
        | 'Techno'
        | 'House'
        | 'Game'
        | 'Film'
        | 'Alt'
        | 'Dubstep'
        | 'Metal'
        | 'Anime'
        | 'HipHop'
        | 'JPop'
        | 'Dance'
        | 'Rock'
        | 'Pop'
        | 'Electronic'
    )[]
    /** @format date-time */
    updatedAt: string
    /** @format date-time */
    uploaded: string
    /** UserDetail */
    uploader: UserDetail
    versions: MapVersion[]
}

export interface UserDetail {
    admin: boolean
    avatar: string
    curator: boolean
    curatorTab: boolean
    description: string
    email: string
    /** UserFollowData */
    followData: UserFollowData
    hash: string
    /** @format int32 */
    id: number
    name: string
    patreon: 'None' | 'Supporter' | 'SupporterPlus'
    playlistUrl: string
    seniorCurator: boolean
    /** UserStats */
    stats: UserStats
    /** @format date-time */
    suspendedAt: string
    testplay: boolean
    type: 'DISCORD' | 'SIMPLE' | 'DUAL'
    uniqueSet: boolean
    /** @format int32 */
    uploadLimit: number
    verifiedMapper: boolean
}

export interface UserFollowData {
    collab: boolean
    curation: boolean
    /** @format int32 */
    followers: number
    following: boolean
    /** @format int32 */
    follows: number
    upload: boolean
}

export interface UserStats {
    /** Float */
    avgBpm: Float
    /** Float */
    avgDuration: Float
    /** Float */
    avgScore: Float
    /** UserDiffStats */
    diffStats: UserDiffStats
    /** @format date-time */
    firstUpload: string
    /** @format date-time */
    lastUpload: string
    /** @format int32 */
    rankedMaps: number
    /** @format int32 */
    totalDownvotes: number
    /** @format int32 */
    totalMaps: number
    /** @format int32 */
    totalUpvotes: number
}

export type Float = any

export interface UserDiffStats {
    /** @format int32 */
    easy: number
    /** @format int32 */
    expert: number
    /** @format int32 */
    expertPlus: number
    /** @format int32 */
    hard: number
    /** @format int32 */
    normal: number
    /** @format int32 */
    total: number
}

export interface MapDetailMetadata {
    /** Float */
    bpm: Float
    /** @format int32 */
    duration: number
    levelAuthorName: string
    songAuthorName: string
    songName: string
    songSubName: string
}

export interface MapStats {
    /** @format int32 */
    downloads: number
    /** @format int32 */
    downvotes: number
    /** @format int32 */
    plays: number
    /** @format int32 */
    reviews: number
    /** Float */
    score: Float
    /** Float */
    scoreOneDP: Float
    sentiment:
        | 'PENDING'
        | 'VERY_NEGATIVE'
        | 'MOSTLY_NEGATIVE'
        | 'MIXED'
        | 'MOSTLY_POSITIVE'
        | 'VERY_POSITIVE'
    /** @format int32 */
    upvotes: number
}

export interface MapVersion {
    coverURL: string
    /** @format date-time */
    createdAt: string
    diffs: MapDifficulty[]
    downloadURL: string
    feedback: string
    hash: string
    key: string
    previewURL: string
    /** Short */
    sageScore: Short
    /** @format date-time */
    scheduledAt: string
    state: 'Uploaded' | 'Testplay' | 'Published' | 'Feedback' | 'Scheduled'
    /** @format date-time */
    testplayAt: string
    testplays: MapTestplay[]
}

export interface MapDifficulty {
    /** Float */
    blStars?: Float
    /** @format int32 */
    bombs: number
    characteristic:
        | 'Standard'
        | 'OneSaber'
        | 'NoArrows'
        | '90Degree'
        | '360Degree'
        | 'Lightshow'
        | 'Lawless'
        | 'Legacy'
    chroma: boolean
    cinema: boolean
    difficulty: 'Easy' | 'Normal' | 'Hard' | 'Expert' | 'ExpertPlus'
    environment:
        | 'DefaultEnvironment'
        | 'TriangleEnvironment'
        | 'NiceEnvironment'
        | 'BigMirrorEnvironment'
        | 'KDAEnvironment'
        | 'MonstercatEnvironment'
        | 'CrabRaveEnvironment'
        | 'DragonsEnvironment'
        | 'OriginsEnvironment'
        | 'PanicEnvironment'
        | 'RocketEnvironment'
        | 'GreenDayEnvironment'
        | 'GreenDayGrenadeEnvironment'
        | 'TimbalandEnvironment'
        | 'FitBeatEnvironment'
        | 'LinkinParkEnvironment'
        | 'BTSEnvironment'
        | 'KaleidoscopeEnvironment'
        | 'InterscopeEnvironment'
        | 'SkrillexEnvironment'
        | 'BillieEnvironment'
        | 'HalloweenEnvironment'
        | 'GagaEnvironment'
        | 'GlassDesertEnvironment'
        | 'MultiplayerEnvironment'
        | 'WeaveEnvironment'
        | 'PyroEnvironment'
        | 'EDMEnvironment'
        | 'TheSecondEnvironment'
        | 'LizzoEnvironment'
        | 'TheWeekndEnvironment'
        | 'RockMixtapeEnvironment'
        | 'Dragons2Environment'
        | 'Panic2Environment'
        | 'QueenEnvironment'
        | 'LinkinPark2Environment'
        | 'TheRollingStonesEnvironment'
        | 'LatticeEnvironment'
        | 'DaftPunkEnvironment'
        | 'HipHopEnvironment'
        | 'ColliderEnvironment'
        | 'BritneyEnvironment'
        | 'Monstercat2Environment'
    /** @format int32 */
    events: number
    label: string
    /** @format double */
    length: number
    /** @format int32 */
    maxScore: number
    me: boolean
    ne: boolean
    /** Float */
    njs: Float
    /** @format int32 */
    notes: number
    /** @format double */
    nps: number
    /** @format int32 */
    obstacles: number
    /** Float */
    offset: Float
    /** MapParitySummary */
    paritySummary: MapParitySummary
    /** @format double */
    seconds: number
    /** Float */
    stars?: Float
}

export interface MapParitySummary {
    /** @format int32 */
    errors: number
    /** @format int32 */
    resets: number
    /** @format int32 */
    warns: number
}

export type Short = any

export interface MapTestplay {
    /** @format date-time */
    createdAt: string
    feedback: string
    /** @format date-time */
    feedbackAt: string
    /** UserDetail */
    user: UserDetail
    video: string
}

export interface SearchResponse {
    docs: MapDetail[]
    /** SearchInfo */
    info: SearchInfo
    redirect: string
}

export interface SearchInfo {
    /** Float */
    duration: Float
    /** @format int32 */
    pages: number
    /** @format int32 */
    total: number
}

export interface DeletedResponse {
    docs: DeletedMap[]
}

export interface DeletedMap {
    /** @format date-time */
    deletedAt: string
    id: string
}

export interface UserSearchResponse {
    docs: UserDetail[]
    /** SearchInfo */
    info: SearchInfo
}

export interface AuthRequest {
    oculusId: string
    proof: string
    steamId: string
}

export interface ActionResponse {
    errors: string[]
    success: boolean
}

/** @uniqueItems false */
export type ListOfVoteSummary = VoteSummary[]

export interface VoteSummary {
    /** @format int32 */
    downvotes: number
    hash: string
    key64: string
    /** @format int32 */
    mapId: number
    /** @format double */
    score: number
    /** @format int32 */
    upvotes: number
}

export interface VoteRequest {
    /** AuthRequest */
    auth: AuthRequest
    direction: boolean
    hash: string
}

export interface PlaylistSearchResponse {
    docs: PlaylistFull[]
    /** SearchInfo */
    info: SearchInfo
}

export interface PlaylistFull {
    /** IPlaylistConfig */
    config: IPlaylistConfig
    /** @format date-time */
    createdAt: string
    /** @format date-time */
    curatedAt: string
    /** UserDetail */
    curator: UserDetail
    /** @format date-time */
    deletedAt: string
    description: string
    downloadURL: string
    name: string
    /** UserDetail */
    owner: UserDetail
    /** @format int32 */
    playlistId: number
    playlistImage: string
    playlistImage512: string
    /** @format date-time */
    songsChangedAt: string
    /** PlaylistStats */
    stats: PlaylistStats
    type: 'Private' | 'Public' | 'System' | 'Search'
    /** @format date-time */
    updatedAt: string
}

export type IPlaylistConfig = any

export interface PlaylistStats {
    /** Float */
    avgScore: Float
    /** @format int32 */
    downVotes: number
    /** @format int64 */
    mapperCount: number
    /** @format double */
    maxNps: number
    /** @format double */
    maxNpsTwoDP: number
    /** @format double */
    minNps: number
    /** @format double */
    minNpsTwoDP: number
    /** Float */
    scoreOneDP: Float
    /** @format int32 */
    totalDuration: number
    /** @format int32 */
    totalMaps: number
    /** @format int32 */
    upVotes: number
}

export interface PlaylistPage {
    maps: MapDetailWithOrder[]
    /** PlaylistFull */
    playlist: PlaylistFull
}

export interface MapDetailWithOrder {
    /** MapDetail */
    map: MapDetail
    /** Float */
    order: Float
}

export interface PlaylistBatchRequest {
    hashes: string[]
    ignoreUnknown: boolean
    inPlaylist: boolean
    keys: string[]
}
