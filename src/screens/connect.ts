/** Server setup screen: enter server URL and credentials, then connect. */

import { JellyfinClient } from '../api/jellyfin';
import { setConnection } from '../state/app';
import { saveSession } from '../state/session';
import { focusFirst, makeFocusable } from '../navigation/spatial';
import { replaceAll, type Screen } from '../router';
import { el } from '../ui/dom';
import { createHomeScreen } from './home';

function field(labelText: string, input: HTMLInputElement): HTMLElement {
  makeFocusable(input);
  input.classList.add('input');
  return el('label', { className: 'field' }, [
    el('span', { className: 'field-label', text: labelText }),
    input,
  ]);
}

export function createConnectScreen(): Screen {
  const serverInput = el('input', {
    attrs: {
      type: 'text',
      placeholder: 'http://192.168.1.10:8096',
      autocapitalize: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
      'data-autofocus': '',
    },
  });
  const userInput = el('input', {
    attrs: { type: 'text', placeholder: 'Username', autocapitalize: 'off', spellcheck: 'false' },
  });
  const passInput = el('input', { attrs: { type: 'password', placeholder: 'Password' } });

  const errorBox = el('p', { className: 'form-error', attrs: { 'aria-live': 'polite' } });

  const connectButton = makeFocusable(
    el('button', { className: 'btn btn-primary', text: 'Connect' }),
  ) as HTMLButtonElement;

  async function connect(): Promise<void> {
    const serverUrl = serverInput.value.trim();
    const username = userInput.value.trim();
    const password = passInput.value;

    errorBox.textContent = '';
    if (!serverUrl || !username) {
      errorBox.textContent = 'Server address and username are required.';
      return;
    }

    connectButton.disabled = true;
    connectButton.textContent = 'Connecting…';
    try {
      const client = new JellyfinClient(serverUrl);
      const session = await client.authenticate(username, password);
      saveSession(session);
      setConnection(client, session);
      replaceAll(createHomeScreen());
    } catch (error) {
      errorBox.textContent =
        error instanceof Error && /401|400/.test(error.message)
          ? 'Sign-in failed. Check your username and password.'
          : 'Could not reach the server. Check the address and your network.';
      connectButton.disabled = false;
      connectButton.textContent = 'Connect';
      focusFirst(root);
    } finally {
      if (connectButton.disabled) {
        connectButton.disabled = false;
        connectButton.textContent = 'Connect';
      }
    }
  }

  connectButton.addEventListener('click', () => void connect());

  const root = el('section', { className: 'screen screen-connect' }, [
    el('div', { className: 'connect-panel' }, [
      el('h1', { className: 'brand', text: 'Mivio' }),
      el('p', {
        className: 'connect-subtitle',
        text: 'Connect to your Jellyfin server. Plex support is coming soon.',
      }),
      field('Server address', serverInput),
      field('Username', userInput),
      field('Password', passInput),
      errorBox,
      el('div', { className: 'connect-actions' }, [connectButton]),
    ]),
  ]);

  return { el: root };
}
