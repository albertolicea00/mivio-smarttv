/**
 * Minimal stack-based screen router.
 * Screens are plain objects owning a root element; `back` pops the stack and
 * exits the app when pressed on the root screen (standard TV behavior).
 */

import { exitApp } from '@shared/platform';
import { currentFocus, focusFirst, setFocus } from './navigation/spatial';

export interface Screen {
  /** Root element of the screen; appended to the app container. */
  el: HTMLElement;
  /** Called after the screen element is (re)attached and visible. */
  onShow?(): void;
  /** Called when the screen gets covered or removed. */
  onHide?(): void;
  /** Return true to consume the back press (e.g. close an overlay). */
  onBack?(): boolean;
  /** Called when the screen is popped and will never be shown again. */
  destroy?(): void;
}

interface StackEntry {
  screen: Screen;
  lastFocused: HTMLElement | null;
}

let container: HTMLElement;
const stack: StackEntry[] = [];

export function initRouter(rootContainer: HTMLElement): void {
  container = rootContainer;
}

function top(): StackEntry | undefined {
  return stack[stack.length - 1];
}

function showTop(restoreFocus: boolean): void {
  const entry = top();
  if (!entry) return;
  entry.screen.el.classList.remove('screen-hidden');
  entry.screen.onShow?.();
  if (restoreFocus && entry.lastFocused && document.contains(entry.lastFocused)) {
    setFocus(entry.lastFocused);
  } else {
    focusFirst(entry.screen.el);
  }
}

/** Push a new screen on top of the stack. */
export function push(screen: Screen): void {
  const previous = top();
  if (previous) {
    previous.lastFocused = currentFocus();
    previous.screen.onHide?.();
    previous.screen.el.classList.add('screen-hidden');
  }
  stack.push({ screen, lastFocused: null });
  container.appendChild(screen.el);
  showTop(false);
}

/** Replace the whole stack with a single screen (e.g. after login/logout). */
export function replaceAll(screen: Screen): void {
  while (stack.length > 0) {
    const entry = stack.pop()!;
    entry.screen.onHide?.();
    entry.screen.destroy?.();
    entry.screen.el.remove();
  }
  push(screen);
}

/** Handle a back press. Pops one screen or exits the app at the root. */
export function back(): void {
  const entry = top();
  if (!entry) {
    exitApp();
    return;
  }
  if (entry.screen.onBack?.()) return;
  if (stack.length <= 1) {
    exitApp();
    return;
  }
  stack.pop();
  entry.screen.onHide?.();
  entry.screen.destroy?.();
  entry.screen.el.remove();
  showTop(true);
}
