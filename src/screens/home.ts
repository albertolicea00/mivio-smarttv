/** Home screen: media library rows with focusable poster cards. */

import type { MediaItem, MediaServerClient } from '../api/types';
import { clearConnection, getClient, getSession } from '../state/app';
import { clearSession } from '../state/session';
import { currentFocus, focusFirst, makeFocusable } from '../navigation/spatial';
import { push, replaceAll, type Screen } from '../router';
import { clear, el } from '../ui/dom';
import { createConnectScreen } from './connect';
import { createDetailScreen } from './detail';

const POSTER_WIDTH = 360; // Requested image width (2x card size for sharpness).

export function createCard(client: MediaServerClient, item: MediaItem): HTMLElement {
  const poster = el('div', { className: 'card-poster' });
  const imageUrl = client.imageUrl(item, 'poster', POSTER_WIDTH);
  if (imageUrl) {
    poster.appendChild(
      el('img', {
        attrs: { src: imageUrl, alt: '', loading: 'lazy', draggable: 'false' },
      }),
    );
  } else {
    poster.appendChild(el('span', { className: 'card-poster-fallback', text: item.name }));
  }

  if (item.playedPercentage && item.playedPercentage > 0 && item.playedPercentage < 100) {
    const bar = el('div', { className: 'card-progress' });
    const fill = el('div', { className: 'card-progress-fill' });
    fill.style.width = `${Math.min(100, item.playedPercentage)}%`;
    bar.appendChild(fill);
    poster.appendChild(bar);
  }

  const subtitle =
    item.type === 'Episode' && item.seriesName
      ? `${item.seriesName} · S${item.seasonNumber ?? '?'}E${item.episodeNumber ?? '?'}`
      : item.year
        ? String(item.year)
        : '';

  const card = el('div', { className: 'card', attrs: { role: 'button' } }, [
    poster,
    el('div', { className: 'card-title', text: item.name }),
    subtitle ? el('div', { className: 'card-subtitle', text: subtitle }) : null,
  ]);
  makeFocusable(card);
  card.addEventListener('click', () => push(createDetailScreen(item.id)));
  return card;
}

export function createRow(
  client: MediaServerClient,
  title: string,
  items: MediaItem[],
): HTMLElement | null {
  if (items.length === 0) return null;
  return el('section', { className: 'row' }, [
    el('h2', { className: 'row-title', text: title }),
    el(
      'div',
      { className: 'row-scroller' },
      items.map((item) => createCard(client, item)),
    ),
  ]);
}

export function createHomeScreen(): Screen {
  const session = getSession();
  const rowsContainer = el('div', { className: 'rows' });
  const status = el('p', { className: 'status', text: 'Loading your libraries…' });

  const disconnectButton = makeFocusable(
    el('button', {
      className: 'btn btn-ghost',
      text: 'Disconnect',
      onClick: () => {
        clearSession();
        clearConnection();
        replaceAll(createConnectScreen());
      },
    }),
  );

  const root = el('section', { className: 'screen screen-home' }, [
    el('header', { className: 'topbar' }, [
      el('h1', { className: 'brand brand-small', text: 'Mivio' }),
      el('div', { className: 'topbar-right' }, [
        el('span', { className: 'topbar-user', text: session?.userName ?? '' }),
        disconnectButton,
      ]),
    ]),
    status,
    rowsContainer,
  ]);

  let loaded = false;

  async function load(): Promise<void> {
    const client = getClient();
    try {
      const [resumeItems, libraries] = await Promise.all([
        client.getResumeItems().catch(() => [] as MediaItem[]),
        client.getLibraries(),
      ]);

      clear(rowsContainer);
      const continueRow = createRow(client, 'Continue Watching', resumeItems);
      if (continueRow) rowsContainer.appendChild(continueRow);

      const libraryRows = await Promise.all(
        libraries.map(async (library) => {
          const items = await client.getLatestItems(library.id).catch(() => [] as MediaItem[]);
          return createRow(client, library.name, items);
        }),
      );
      for (const row of libraryRows) {
        if (row) rowsContainer.appendChild(row);
      }

      status.textContent =
        rowsContainer.children.length === 0 ? 'No media found on this server.' : '';
      status.classList.toggle('hidden', rowsContainer.children.length > 0);
      loaded = true;

      // Land the user on the first card instead of the top bar.
      const focused = currentFocus();
      if ((!focused || focused === disconnectButton) && rowsContainer.children.length > 0) {
        focusFirst(rowsContainer);
      }
    } catch {
      status.textContent = 'Failed to load libraries from the server.';
      const retry = makeFocusable(
        el('button', {
          className: 'btn btn-primary',
          text: 'Retry',
          attrs: { 'data-autofocus': '' },
          onClick: () => {
            retry.remove();
            status.textContent = 'Loading your libraries…';
            void load();
          },
        }),
      );
      status.appendChild(el('br'));
      status.appendChild(retry);
    }
  }

  return {
    el: root,
    onShow() {
      if (!loaded) void load();
    },
  };
}
