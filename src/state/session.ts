/**
 * Session persistence. Only the connection handle (server URL + token) is
 * stored locally; profiles and watch state live on the home server.
 */

import type { SavedSession } from '../api/types';

const SESSION_KEY = 'mivio.session';
const DEVICE_ID_KEY = 'mivio.deviceId';

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SavedSession;
    if (!session.serverUrl || !session.accessToken || !session.userId) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: SavedSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Stable per-install device id, required by Jellyfin auth headers. */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `mivio-tv-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
