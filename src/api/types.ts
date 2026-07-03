/**
 * Server-agnostic media types and the MediaServerClient contract.
 * JellyfinClient implements it today; PlexClient is stubbed for later.
 */

export type ServerKind = 'jellyfin' | 'plex';

export interface Library {
  id: string;
  name: string;
  /** Server-reported collection type, e.g. "movies", "tvshows". */
  collectionType?: string;
}

export type MediaItemType =
  | 'Movie'
  | 'Series'
  | 'Season'
  | 'Episode'
  | 'Video'
  | 'Folder'
  | 'Other';

export interface MediaItem {
  id: string;
  name: string;
  type: MediaItemType;
  overview?: string;
  year?: number;
  /** Runtime in ticks (10,000,000 ticks = 1 second, Jellyfin convention). */
  runtimeTicks?: number;
  /** Resume position in ticks. */
  playbackPositionTicks?: number;
  playedPercentage?: number;
  played?: boolean;
  /** True when the item contains children (series, seasons, folders). */
  isFolder: boolean;
  seriesName?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  /** Opaque image tags used by imageUrl(). */
  primaryImageTag?: string;
  backdropImageTag?: string;
}

export type ImageKind = 'poster' | 'backdrop';

export interface StreamInfo {
  /** Direct-play URL consumable by an HTML5 <video> element. */
  url: string;
  playSessionId: string;
  mediaSourceId: string;
  container?: string;
}

export interface SavedSession {
  kind: ServerKind;
  serverUrl: string;
  userId: string;
  userName: string;
  accessToken: string;
}

export interface PlaybackReport {
  itemId: string;
  mediaSourceId: string;
  playSessionId: string;
  positionTicks: number;
  isPaused?: boolean;
}

/**
 * Contract every home-server backend must fulfil.
 * Keep this interface transport-agnostic so a PlexClient (and later Emby)
 * can be dropped in without touching the screens.
 */
export interface MediaServerClient {
  readonly kind: ServerKind;
  readonly serverUrl: string;

  /** Authenticate with user credentials; resolves once a session exists. */
  authenticate(username: string, password: string): Promise<SavedSession>;
  /** Restore a previously saved session (validated lazily on first request). */
  restore(session: SavedSession): void;
  /** Cheap server round-trip to verify the stored token is still valid. */
  validate(): Promise<boolean>;

  getLibraries(): Promise<Library[]>;
  /** In-progress items for the "Continue Watching" row. */
  getResumeItems(): Promise<MediaItem[]>;
  /** Latest additions for a library row. */
  getLatestItems(libraryId: string, limit?: number): Promise<MediaItem[]>;
  /** Children of a folder-like item (library, series, season). */
  getChildren(parentId: string): Promise<MediaItem[]>;
  getItem(itemId: string): Promise<MediaItem>;

  /** Absolute image URL for an item, or null when no image exists. */
  imageUrl(item: MediaItem, kind: ImageKind, maxWidth: number): string | null;

  /** Resolve a direct-play stream for the item. */
  getStreamInfo(item: MediaItem): Promise<StreamInfo>;

  /** Watch-progress reporting; state lives entirely on the server. */
  reportPlaybackStart(report: PlaybackReport): Promise<void>;
  reportPlaybackProgress(report: PlaybackReport): Promise<void>;
  reportPlaybackStopped(report: PlaybackReport): Promise<void>;
}
