/** Detail screen: hero layout with metadata, play/resume actions and children. */

import type { MediaItem } from '../api/types';
import { getClient } from '../state/app';
import { focusFirst, makeFocusable } from '../navigation/spatial';
import { push, type Screen } from '../router';
import { clear, el, formatRuntime } from '../ui/dom';
import { createPlayerScreen } from './player';
import { createRow } from './home';

const BACKDROP_WIDTH = 1920;
const POSTER_WIDTH = 600;

function ticksToSeconds(ticks: number): number {
  return ticks / 10_000_000;
}

export function createDetailScreen(itemId: string): Screen {
  const content = el('div', { className: 'detail-content' }, [
    el('p', { className: 'status', text: 'Loading…' }),
  ]);
  const root = el('section', { className: 'screen screen-detail' }, [content]);

  function render(item: MediaItem): void {
    const client = getClient();
    clear(content);

    const backdropUrl = client.imageUrl(item, 'backdrop', BACKDROP_WIDTH);
    if (backdropUrl) {
      root.style.backgroundImage =
        'linear-gradient(rgba(10, 12, 18, 0.72), rgba(10, 12, 18, 0.95)), ' +
        `url("${backdropUrl}")`;
    }

    const posterUrl = client.imageUrl(item, 'poster', POSTER_WIDTH);
    const poster = el('div', { className: 'detail-poster' }, [
      posterUrl
        ? el('img', { attrs: { src: posterUrl, alt: '', draggable: 'false' } })
        : el('span', { className: 'card-poster-fallback', text: item.name }),
    ]);

    const metaParts: string[] = [];
    if (item.type === 'Episode' && item.seriesName) {
      metaParts.push(`${item.seriesName} · S${item.seasonNumber ?? '?'}E${item.episodeNumber ?? '?'}`);
    }
    if (item.year) metaParts.push(String(item.year));
    const runtime = formatRuntime(item.runtimeTicks);
    if (runtime) metaParts.push(runtime);
    if (item.played) metaParts.push('Watched');

    const actions = el('div', { className: 'detail-actions' });
    const playable = !item.isFolder;

    if (playable) {
      const resumeTicks = item.playbackPositionTicks ?? 0;
      if (resumeTicks > 0) {
        actions.appendChild(
          makeFocusable(
            el('button', {
              className: 'btn btn-primary',
              text: `Resume (${formatRuntime(resumeTicks) || 'start'})`,
              attrs: { 'data-autofocus': '' },
              onClick: () => push(createPlayerScreen(item, ticksToSeconds(resumeTicks))),
            }),
          ),
        );
      }
      actions.appendChild(
        makeFocusable(
          el('button', {
            className: resumeTicks > 0 ? 'btn' : 'btn btn-primary',
            text: 'Play',
            attrs: resumeTicks > 0 ? {} : { 'data-autofocus': '' },
            onClick: () => push(createPlayerScreen(item, 0)),
          }),
        ),
      );
    }

    const info = el('div', { className: 'detail-info' }, [
      el('h1', { className: 'detail-title', text: item.name }),
      metaParts.length > 0
        ? el('p', { className: 'detail-meta', text: metaParts.join('  ·  ') })
        : null,
      item.overview ? el('p', { className: 'detail-overview', text: item.overview }) : null,
      actions,
    ]);

    content.appendChild(el('div', { className: 'detail-hero' }, [poster, info]));

    if (item.isFolder) {
      const childrenTitle =
        item.type === 'Series' ? 'Seasons' : item.type === 'Season' ? 'Episodes' : 'Items';
      void client
        .getChildren(item.id)
        .then((children) => {
          const row = createRow(client, childrenTitle, children);
          if (row) {
            content.appendChild(row);
            if (!playable) focusFirst(row);
          }
        })
        .catch(() => {
          content.appendChild(
            el('p', { className: 'status', text: 'Failed to load contents.' }),
          );
        });
    }

    focusFirst(content);
  }

  async function load(): Promise<void> {
    try {
      const item = await getClient().getItem(itemId);
      render(item);
    } catch {
      clear(content);
      content.appendChild(
        el('p', { className: 'status', text: 'Failed to load this title from the server.' }),
      );
    }
  }

  return {
    el: root,
    onShow() {
      // Reload on every show so watch progress from a finished playback
      // session is reflected immediately (state lives on the server).
      void load();
    },
  };
}
