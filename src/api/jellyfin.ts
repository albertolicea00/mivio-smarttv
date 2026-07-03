/**
 * Jellyfin implementation of MediaServerClient.
 * Uses the stable Jellyfin REST API:
 *   - POST /Users/AuthenticateByName
 *   - GET  /Users/{userId}/Views
 *   - GET  /Users/{userId}/Items, /Items/Resume, /Items/Latest
 *   - POST /Items/{id}/PlaybackInfo (+ direct-play /Videos/{id}/stream)
 *   - POST /Sessions/Playing[/Progress|/Stopped]
 */

import { detectPlatform } from '@shared/platform';
import { getDeviceId } from '../state/session';
import type {
  ImageKind,
  Library,
  MediaItem,
  MediaItemType,
  MediaServerClient,
  PlaybackReport,
  SavedSession,
  StreamInfo,
} from './types';

const CLIENT_NAME = 'Mivio Smart TV';
const CLIENT_VERSION = '0.1.0';
const ITEM_FIELDS = 'Overview,PrimaryImageAspectRatio,ProductionYear';

// ---- Jellyfin DTOs (subset we consume) -------------------------------------

interface JFUserData {
  PlaybackPositionTicks?: number;
  PlayedPercentage?: number;
  Played?: boolean;
}

interface JFItem {
  Id: string;
  Name: string;
  Type?: string;
  CollectionType?: string;
  Overview?: string;
  ProductionYear?: number;
  RunTimeTicks?: number;
  IsFolder?: boolean;
  SeriesName?: string;
  ParentIndexNumber?: number;
  IndexNumber?: number;
  ImageTags?: { Primary?: string };
  BackdropImageTags?: string[];
  ParentBackdropImageTags?: string[];
  SeriesPrimaryImageTag?: string;
  UserData?: JFUserData;
}

interface JFItemsResult {
  Items?: JFItem[];
}

interface JFAuthResult {
  User: { Id: string; Name: string };
  AccessToken: string;
}

interface JFMediaSource {
  Id: string;
  Container?: string;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
}

interface JFPlaybackInfo {
  MediaSources?: JFMediaSource[];
  PlaySessionId?: string;
}

// ---- Client -----------------------------------------------------------------

export class JellyfinClient implements MediaServerClient {
  readonly kind = 'jellyfin' as const;
  readonly serverUrl: string;

  private accessToken: string | null = null;
  private userId: string | null = null;
  private readonly deviceId = getDeviceId();

  constructor(serverUrl: string) {
    this.serverUrl = normalizeServerUrl(serverUrl);
  }

  // -- Auth -------------------------------------------------------------------

  private authHeader(): string {
    const device = detectPlatform() === 'browser' ? 'Browser' : detectPlatform();
    let header =
      `MediaBrowser Client="${CLIENT_NAME}", Device="${device}", ` +
      `DeviceId="${this.deviceId}", Version="${CLIENT_VERSION}"`;
    if (this.accessToken) header += `, Token="${this.accessToken}"`;
    return header;
  }

  private async request<T>(
    path: string,
    options: { method?: string; body?: unknown; query?: Record<string, string> } = {},
  ): Promise<T> {
    const url = new URL(this.serverUrl + path);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
    }
    const response = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': this.authHeader(),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Jellyfin request failed (${response.status}) for ${path}`);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private requireUserId(): string {
    if (!this.userId) throw new Error('Not authenticated');
    return this.userId;
  }

  async authenticate(username: string, password: string): Promise<SavedSession> {
    const result = await this.request<JFAuthResult>('/Users/AuthenticateByName', {
      method: 'POST',
      body: { Username: username, Pw: password },
    });
    this.accessToken = result.AccessToken;
    this.userId = result.User.Id;
    return {
      kind: this.kind,
      serverUrl: this.serverUrl,
      userId: result.User.Id,
      userName: result.User.Name,
      accessToken: result.AccessToken,
    };
  }

  restore(session: SavedSession): void {
    this.accessToken = session.accessToken;
    this.userId = session.userId;
  }

  async validate(): Promise<boolean> {
    try {
      await this.request<unknown>(`/Users/${this.requireUserId()}`);
      return true;
    } catch {
      return false;
    }
  }

  // -- Catalog ----------------------------------------------------------------

  async getLibraries(): Promise<Library[]> {
    const result = await this.request<JFItemsResult>(`/Users/${this.requireUserId()}/Views`);
    return (result.Items ?? [])
      .filter((item) => item.CollectionType !== 'boxsets' && item.CollectionType !== 'playlists')
      .map((item) => ({
        id: item.Id,
        name: item.Name,
        collectionType: item.CollectionType,
      }));
  }

  async getResumeItems(): Promise<MediaItem[]> {
    const result = await this.request<JFItemsResult>(
      `/Users/${this.requireUserId()}/Items/Resume`,
      {
        query: {
          Limit: '20',
          Fields: ITEM_FIELDS,
          MediaTypes: 'Video',
          ImageTypeLimit: '1',
        },
      },
    );
    return (result.Items ?? []).map(mapItem);
  }

  async getLatestItems(libraryId: string, limit = 24): Promise<MediaItem[]> {
    // /Items/Latest returns a bare array, not an ItemsResult envelope.
    const items = await this.request<JFItem[]>(`/Users/${this.requireUserId()}/Items/Latest`, {
      query: {
        ParentId: libraryId,
        Limit: String(limit),
        Fields: ITEM_FIELDS,
        ImageTypeLimit: '1',
      },
    });
    return (items ?? []).map(mapItem);
  }

  async getChildren(parentId: string): Promise<MediaItem[]> {
    const result = await this.request<JFItemsResult>(`/Users/${this.requireUserId()}/Items`, {
      query: {
        ParentId: parentId,
        SortBy: 'SortName',
        SortOrder: 'Ascending',
        Fields: ITEM_FIELDS,
        ImageTypeLimit: '1',
      },
    });
    return (result.Items ?? []).map(mapItem);
  }

  async getItem(itemId: string): Promise<MediaItem> {
    const item = await this.request<JFItem>(`/Users/${this.requireUserId()}/Items/${itemId}`);
    return mapItem(item);
  }

  imageUrl(item: MediaItem, kind: ImageKind, maxWidth: number): string | null {
    if (kind === 'poster') {
      if (!item.primaryImageTag) return null;
      return (
        `${this.serverUrl}/Items/${item.id}/Images/Primary` +
        `?maxWidth=${maxWidth}&tag=${item.primaryImageTag}&quality=90`
      );
    }
    if (!item.backdropImageTag) return null;
    return (
      `${this.serverUrl}/Items/${item.id}/Images/Backdrop/0` +
      `?maxWidth=${maxWidth}&tag=${item.backdropImageTag}&quality=90`
    );
  }

  // -- Playback ---------------------------------------------------------------

  async getStreamInfo(item: MediaItem): Promise<StreamInfo> {
    const info = await this.request<JFPlaybackInfo>(`/Items/${item.id}/PlaybackInfo`, {
      method: 'POST',
      query: { UserId: this.requireUserId() },
      body: {},
    });
    const source = info.MediaSources?.[0];
    if (!source) throw new Error('No playable media source returned by the server');

    const playSessionId = info.PlaySessionId ?? `mivio-${Date.now()}`;
    const container = source.Container || 'mp4';
    // Direct play: let the TV decoder handle the original file.
    // TODO: fall back to the server transcoding URL when SupportsDirectPlay
    // is false or the codec is outside the TV's capabilities (device profile).
    const url =
      `${this.serverUrl}/Videos/${item.id}/stream.${container}?static=true` +
      `&mediaSourceId=${encodeURIComponent(source.Id)}` +
      `&deviceId=${encodeURIComponent(this.deviceId)}` +
      `&playSessionId=${encodeURIComponent(playSessionId)}` +
      `&api_key=${encodeURIComponent(this.accessToken ?? '')}`;

    return { url, playSessionId, mediaSourceId: source.Id, container };
  }

  async reportPlaybackStart(report: PlaybackReport): Promise<void> {
    await this.request<void>('/Sessions/Playing', {
      method: 'POST',
      body: {
        ItemId: report.itemId,
        MediaSourceId: report.mediaSourceId,
        PlaySessionId: report.playSessionId,
        PositionTicks: Math.round(report.positionTicks),
        CanSeek: true,
        PlayMethod: 'DirectPlay',
      },
    });
  }

  async reportPlaybackProgress(report: PlaybackReport): Promise<void> {
    await this.request<void>('/Sessions/Playing/Progress', {
      method: 'POST',
      body: {
        ItemId: report.itemId,
        MediaSourceId: report.mediaSourceId,
        PlaySessionId: report.playSessionId,
        PositionTicks: Math.round(report.positionTicks),
        IsPaused: report.isPaused ?? false,
        PlayMethod: 'DirectPlay',
      },
    });
  }

  async reportPlaybackStopped(report: PlaybackReport): Promise<void> {
    await this.request<void>('/Sessions/Playing/Stopped', {
      method: 'POST',
      body: {
        ItemId: report.itemId,
        MediaSourceId: report.mediaSourceId,
        PlaySessionId: report.playSessionId,
        PositionTicks: Math.round(report.positionTicks),
      },
    });
  }
}

// ---- Helpers ----------------------------------------------------------------

export function normalizeServerUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  return url.replace(/\/+$/, '');
}

function mapItemType(type: string | undefined, isFolder: boolean): MediaItemType {
  switch (type) {
    case 'Movie':
    case 'Series':
    case 'Season':
    case 'Episode':
    case 'Video':
      return type;
    default:
      return isFolder ? 'Folder' : 'Other';
  }
}

function mapItem(item: JFItem): MediaItem {
  const isFolder = item.IsFolder ?? false;
  return {
    id: item.Id,
    name: item.Name,
    type: mapItemType(item.Type, isFolder),
    overview: item.Overview,
    year: item.ProductionYear,
    runtimeTicks: item.RunTimeTicks,
    playbackPositionTicks: item.UserData?.PlaybackPositionTicks,
    playedPercentage: item.UserData?.PlayedPercentage,
    played: item.UserData?.Played,
    isFolder,
    seriesName: item.SeriesName,
    seasonNumber: item.ParentIndexNumber,
    episodeNumber: item.IndexNumber,
    primaryImageTag: item.ImageTags?.Primary ?? item.SeriesPrimaryImageTag,
    backdropImageTag: item.BackdropImageTags?.[0] ?? item.ParentBackdropImageTags?.[0],
  };
}
