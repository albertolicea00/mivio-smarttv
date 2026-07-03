/** Mivio Smart TV entry point: boot, session restore and input wiring. */

import './styles/main.css';
import { detectPlatform, registerRemoteKeys } from '@shared/platform';
import { initInput } from './navigation/input';
import { initRouter, push } from './router';
import { clientForSession, setConnection } from './state/app';
import { clearSession, loadSession } from './state/session';
import { createConnectScreen } from './screens/connect';
import { createHomeScreen } from './screens/home';

async function boot(): Promise<void> {
  const container = document.getElementById('app');
  if (!container) throw new Error('Missing #app container');

  document.documentElement.dataset.platform = detectPlatform();
  registerRemoteKeys();
  initRouter(container);
  initInput();

  // Resume the saved server connection when the token is still valid;
  // otherwise fall back to the setup screen. No local profiles: everything
  // beyond this connection handle lives on the home server.
  const session = loadSession();
  if (session) {
    const client = clientForSession(session);
    setConnection(client, session);
    const valid = await client.validate();
    if (valid) {
      push(createHomeScreen());
      return;
    }
    clearSession();
  }
  push(createConnectScreen());
}

void boot();
