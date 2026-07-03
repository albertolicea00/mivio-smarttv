/**
 * Video player screen.
 * Direct-plays the server stream through an HTML5 <video> element (the TV
 * runtime provides hardware decoding) and reports watch progress back to the
 * server: start, periodic progress, pause state and stop.
 */

import type { RemoteAction } from '@shared/platform';
import type { MediaItem, StreamInfo } from '../api/types';
import { getClient } from '../state/app';
import { setActionInterceptor } from '../navigation/input';
import { back, type Screen } from '../router';
import { el, formatTime } from '../ui/dom';

const SEEK_STEP_SECONDS = 15;
const JUMP_STEP_SECONDS = 60;
const PROGRESS_REPORT_INTERVAL_MS = 10_000;
const OSD_HIDE_DELAY_MS = 4_000;
const TICKS_PER_SECOND = 10_000_000;

export function createPlayerScreen(item: MediaItem, startSeconds: number): Screen {
  const client = getClient();

  const video = el('video', {
    className: 'player-video',
    attrs: { preload: 'auto', 'webkit-playsinline': '', playsinline: '' },
  });
  const spinner = el('div', { className: 'spinner' });
  const errorBox = el('p', { className: 'player-error hidden' });

  const osdTitle = el('div', { className: 'osd-title', text: item.name });
  const osdState = el('div', { className: 'osd-state' });
  const progressFill = el('div', { className: 'osd-progress-fill' });
  const timeCurrent = el('span', { className: 'osd-time', text: '0:00' });
  const timeTotal = el('span', { className: 'osd-time', text: '--:--' });
  const osd = el('div', { className: 'osd' }, [
    osdTitle,
    el('div', { className: 'osd-bottom' }, [
      timeCurrent,
      el('div', { className: 'osd-progress' }, [progressFill]),
      timeTotal,
    ]),
    osdState,
  ]);

  const root = el('section', { className: 'screen screen-player' }, [
    video,
    spinner,
    osd,
    errorBox,
  ]);

  let stream: StreamInfo | null = null;
  let reportTimer: number | null = null;
  let osdTimer: number | null = null;
  let stopped = false;

  // ---- Progress reporting ----------------------------------------------------

  function positionTicks(): number {
    return video.currentTime * TICKS_PER_SECOND;
  }

  function report(kind: 'start' | 'progress' | 'stop'): void {
    if (!stream) return;
    const payload = {
      itemId: item.id,
      mediaSourceId: stream.mediaSourceId,
      playSessionId: stream.playSessionId,
      positionTicks: positionTicks(),
      isPaused: video.paused,
    };
    // Fire-and-forget: reporting must never interrupt playback.
    const promise =
      kind === 'start'
        ? client.reportPlaybackStart(payload)
        : kind === 'progress'
          ? client.reportPlaybackProgress(payload)
          : client.reportPlaybackStopped(payload);
    void promise.catch(() => undefined);
  }

  function stopPlayback(): void {
    if (stopped) return;
    stopped = true;
    if (reportTimer !== null) window.clearInterval(reportTimer);
    if (osdTimer !== null) window.clearTimeout(osdTimer);
    report('stop');
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch {
      // Ignore teardown errors on exotic TV media stacks.
    }
  }

  // ---- OSD -------------------------------------------------------------------

  function updateOsd(): void {
    const duration = video.duration;
    timeCurrent.textContent = formatTime(video.currentTime);
    if (Number.isFinite(duration) && duration > 0) {
      timeTotal.textContent = formatTime(duration);
      progressFill.style.width = `${(video.currentTime / duration) * 100}%`;
    }
    osdState.textContent = video.paused ? 'Paused' : '';
  }

  function showOsd(autoHide = true): void {
    updateOsd();
    osd.classList.add('osd-visible');
    if (osdTimer !== null) window.clearTimeout(osdTimer);
    if (autoHide && !video.paused) {
      osdTimer = window.setTimeout(() => osd.classList.remove('osd-visible'), OSD_HIDE_DELAY_MS);
    }
  }

  // ---- Controls ----------------------------------------------------------------

  function togglePlay(): void {
    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }

  function seekBy(seconds: number): void {
    if (!Number.isFinite(video.duration)) return;
    video.currentTime = Math.max(0, Math.min(video.duration - 1, video.currentTime + seconds));
    showOsd();
  }

  function handleAction(action: RemoteAction): boolean {
    switch (action) {
      case 'enter':
      case 'playPause':
        togglePlay();
        showOsd();
        return true;
      case 'play':
        void video.play().catch(() => undefined);
        showOsd();
        return true;
      case 'pause':
        video.pause();
        showOsd();
        return true;
      case 'left':
      case 'rewind':
        seekBy(action === 'rewind' ? -JUMP_STEP_SECONDS : -SEEK_STEP_SECONDS);
        return true;
      case 'right':
      case 'fastForward':
        seekBy(action === 'fastForward' ? JUMP_STEP_SECONDS : SEEK_STEP_SECONDS);
        return true;
      case 'up':
      case 'down':
        showOsd();
        return true;
      case 'stop':
        back();
        return true;
      case 'back':
        return false; // Let the router pop this screen; destroy() reports stop.
      default:
        return false;
    }
  }

  // ---- Media lifecycle ---------------------------------------------------------

  video.addEventListener('loadedmetadata', () => {
    if (startSeconds > 0 && Number.isFinite(video.duration)) {
      video.currentTime = Math.min(startSeconds, Math.max(0, video.duration - 5));
    }
    updateOsd();
  });
  video.addEventListener('playing', () => {
    spinner.classList.add('hidden');
    showOsd();
  });
  video.addEventListener('waiting', () => spinner.classList.remove('hidden'));
  video.addEventListener('pause', () => {
    showOsd(false);
    report('progress');
  });
  video.addEventListener('play', () => report('progress'));
  video.addEventListener('timeupdate', () => {
    if (osd.classList.contains('osd-visible')) updateOsd();
  });
  video.addEventListener('ended', () => {
    stopPlayback();
    back();
  });
  video.addEventListener('error', () => {
    spinner.classList.add('hidden');
    errorBox.textContent =
      'Playback failed. The file format may not be supported by this TV. ' +
      'Press Back to return.';
    errorBox.classList.remove('hidden');
  });

  async function begin(): Promise<void> {
    try {
      stream = await client.getStreamInfo(item);
      video.src = stream.url;
      await video.play().catch(() => undefined);
      report('start');
      reportTimer = window.setInterval(() => {
        if (!video.paused) report('progress');
      }, PROGRESS_REPORT_INTERVAL_MS);
    } catch {
      spinner.classList.add('hidden');
      errorBox.textContent = 'Could not start playback. Press Back to return.';
      errorBox.classList.remove('hidden');
    }
  }

  return {
    el: root,
    onShow() {
      setActionInterceptor((action) => handleAction(action));
      if (!stream && !stopped) void begin();
    },
    onHide() {
      setActionInterceptor(null);
    },
    destroy() {
      setActionInterceptor(null);
      stopPlayback();
    },
  };
}
