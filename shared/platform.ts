/**
 * Platform abstraction layer shared between Tizen and webOS builds.
 * Detects the runtime, normalizes remote-control key codes and exposes
 * platform APIs (exit, media key registration) behind a single interface.
 */

export type TVPlatform = 'tizen' | 'webos' | 'browser';

/** Remote-control actions the app understands, normalized across platforms. */
export type RemoteAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'enter'
  | 'back'
  | 'play'
  | 'pause'
  | 'playPause'
  | 'stop'
  | 'rewind'
  | 'fastForward';

// Minimal ambient typings for the platform globals injected by the TV runtimes.
interface TizenInputDevice {
  registerKey(name: string): void;
}
interface TizenApplication {
  exit(): void;
}
interface TizenGlobal {
  tvinputdevice?: TizenInputDevice;
  application?: {
    getCurrentApplication(): TizenApplication;
  };
}

declare global {
  interface Window {
    tizen?: TizenGlobal;
    webOS?: unknown;
    webOSSystem?: unknown;
    PalmSystem?: unknown;
  }
}

let cachedPlatform: TVPlatform | null = null;

/** Detect the platform we are running on. Result is cached. */
export function detectPlatform(): TVPlatform {
  if (cachedPlatform) return cachedPlatform;
  if (typeof window.tizen !== 'undefined') {
    cachedPlatform = 'tizen';
  } else if (
    typeof window.webOS !== 'undefined' ||
    typeof window.webOSSystem !== 'undefined' ||
    typeof window.PalmSystem !== 'undefined' ||
    /Web0S|webOS/i.test(navigator.userAgent)
  ) {
    cachedPlatform = 'webos';
  } else {
    cachedPlatform = 'browser';
  }
  return cachedPlatform;
}

/**
 * Remote key code map. Values collected from:
 * - Samsung Tizen TV: https://developer.samsung.com/smarttv (10009 = RETURN, 10252 = MediaPlayPause)
 * - LG webOS TV: 461 = BACK
 * - Shared W3C media key codes: 415 play, 19 pause, 413 stop, 412 rewind, 417 fast-forward
 * - Browser fallbacks: Escape/Backspace for back.
 */
const KEY_TO_ACTION: Record<number, RemoteAction> = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  13: 'enter',
  // Back / return
  10009: 'back', // Tizen RETURN
  461: 'back', // webOS BACK
  27: 'back', // Escape (browser)
  8: 'back', // Backspace (browser; ignored while typing in an input)
  // Media keys
  415: 'play',
  19: 'pause',
  10252: 'playPause', // Tizen MediaPlayPause
  413: 'stop',
  412: 'rewind',
  417: 'fastForward',
};

/** Map a keyboard event to a normalized remote action, or null if unmapped. */
export function keyToAction(event: KeyboardEvent): RemoteAction | null {
  return KEY_TO_ACTION[event.keyCode] ?? null;
}

/**
 * Tizen requires explicit registration before media keys are delivered
 * to the application. No-op on other platforms.
 */
export function registerRemoteKeys(): void {
  if (detectPlatform() !== 'tizen') return;
  const input = window.tizen?.tvinputdevice;
  if (!input) return;
  const keys = [
    'MediaPlay',
    'MediaPause',
    'MediaPlayPause',
    'MediaStop',
    'MediaRewind',
    'MediaFastForward',
  ];
  for (const key of keys) {
    try {
      input.registerKey(key);
    } catch {
      // Key not available on this device model; safe to ignore.
    }
  }
}

/** Exit the application using the platform-native mechanism. */
export function exitApp(): void {
  const platform = detectPlatform();
  try {
    if (platform === 'tizen') {
      window.tizen?.application?.getCurrentApplication().exit();
      return;
    }
    // webOS web apps close via window.close(); in a desktop browser this is
    // usually a no-op, which is fine for development.
    window.close();
  } catch {
    window.close();
  }
}
