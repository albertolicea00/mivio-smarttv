/**
 * Plex implementation of MediaServerClient.
 *
 * TODO: implement against the Plex Media Server API:
 *   - Auth: plex.tv PIN-link flow (preferred on TV) or token sign-in,
 *     then X-Plex-Token on every request.
 *   - Libraries: GET /library/sections
 *   - Items: GET /library/sections/{key}/all, /library/metadata/{key}/children
 *   - Images: /photo/:/transcode?url=...
 *   - Playback: /video/:/transcode/universal/start.m3u8 or direct part URL
 *   - Progress: GET /:/timeline?key=...&state=playing&time=...
 */

import type {
  ImageKind,
  Library,
  MediaItem,
  MediaServerClient,
  PlaybackReport,
  SavedSession,
  StreamInfo,
} from './types';

const NOT_IMPLEMENTED = 'Plex support is not implemented yet';

export class PlexClient implements MediaServerClient {
  readonly kind = 'plex' as const;
  readonly serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  authenticate(_username: string, _password: string): Promise<SavedSession> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  restore(_session: SavedSession): void {
    throw new Error(NOT_IMPLEMENTED);
  }

  validate(): Promise<boolean> {
    return Promise.resolve(false);
  }

  getLibraries(): Promise<Library[]> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  getResumeItems(): Promise<MediaItem[]> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  getLatestItems(_libraryId: string, _limit?: number): Promise<MediaItem[]> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  getChildren(_parentId: string): Promise<MediaItem[]> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  getItem(_itemId: string): Promise<MediaItem> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  imageUrl(_item: MediaItem, _kind: ImageKind, _maxWidth: number): string | null {
    return null;
  }

  getStreamInfo(_item: MediaItem): Promise<StreamInfo> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  reportPlaybackStart(_report: PlaybackReport): Promise<void> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  reportPlaybackProgress(_report: PlaybackReport): Promise<void> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  reportPlaybackStopped(_report: PlaybackReport): Promise<void> {
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }
}
