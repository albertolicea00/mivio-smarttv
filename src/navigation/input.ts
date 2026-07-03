/**
 * Global remote-control input handling.
 * Normalizes key events into RemoteActions, gives text inputs first shot at
 * caret movement, lets an active interceptor (the player) consume actions,
 * and otherwise drives spatial navigation and the router back-stack.
 */

import { keyToAction, type RemoteAction } from '@shared/platform';
import { currentFocus, moveFocus } from './spatial';
import { back } from '../router';

/** Return true to consume the action (used by the player screen). */
export type ActionInterceptor = (action: RemoteAction, event: KeyboardEvent) => boolean;

let interceptor: ActionInterceptor | null = null;

export function setActionInterceptor(fn: ActionInterceptor | null): void {
  interceptor = fn;
}

function isTextInput(element: Element | null): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement &&
    ['text', 'password', 'url', 'email', 'number', 'search'].includes(element.type)
  );
}

export function initInput(): void {
  document.addEventListener('keydown', (event) => {
    const action = keyToAction(event);
    if (!action) return;

    // Let text inputs keep their native editing behavior.
    const active = document.activeElement;
    if (isTextInput(active)) {
      if (action === 'back' && event.keyCode === 8) return; // Backspace deletes text.
      if (action === 'left' || action === 'right') {
        const start = active.selectionStart ?? 0;
        const end = active.selectionEnd ?? start;
        const length = active.value.length;
        const atStart = start === 0 && end === 0;
        const atEnd = start === length && end === length;
        // Move the caret inside the field; only escape at the edges.
        if ((action === 'left' && !atStart) || (action === 'right' && !atEnd)) return;
      }
      if (action === 'enter') {
        // TV IME "Done": close editing and continue to the next control.
        event.preventDefault();
        active.blur();
        moveFocus('down');
        return;
      }
    }

    if (interceptor && interceptor(action, event)) {
      event.preventDefault();
      return;
    }

    switch (action) {
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        event.preventDefault();
        moveFocus(action);
        break;
      case 'enter':
        event.preventDefault();
        currentFocus()?.click();
        break;
      case 'back':
        event.preventDefault();
        back();
        break;
      default:
        // Media keys are only meaningful inside the player (interceptor).
        break;
    }
  });
}
