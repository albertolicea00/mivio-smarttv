/** Global app state: the active server connection. */

import { JellyfinClient } from '../api/jellyfin';
import type { MediaServerClient, SavedSession } from '../api/types';

interface AppState {
  client: MediaServerClient | null;
  session: SavedSession | null;
}

const state: AppState = {
  client: null,
  session: null,
};

export function setConnection(client: MediaServerClient, session: SavedSession): void {
  state.client = client;
  state.session = session;
}

export function clearConnection(): void {
  state.client = null;
  state.session = null;
}

export function getClient(): MediaServerClient {
  if (!state.client) throw new Error('No active server connection');
  return state.client;
}

export function getSession(): SavedSession | null {
  return state.session;
}

/** Build a client for a saved session. Extend here when Plex lands. */
export function clientForSession(session: SavedSession): MediaServerClient {
  // TODO: return new PlexClient(session.serverUrl) when kind === 'plex'.
  const client = new JellyfinClient(session.serverUrl);
  client.restore(session);
  return client;
}
