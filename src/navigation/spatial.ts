/**
 * Spatial navigation engine for the 10-foot UI.
 *
 * Every navigable element carries the `.focusable` class and a tabindex.
 * Arrow keys move real DOM focus to the geometrically nearest candidate in
 * the pressed direction, so native `:focus` styling and input IME behavior
 * keep working.
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

const FOCUSABLE_SELECTOR = '.focusable';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
}

function rectOf(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return {
    left: r.left,
    right: r.right,
    top: r.top,
    bottom: r.bottom,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

function isNavigable(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/** All navigable elements inside `root` (defaults to the whole document). */
export function focusables(root: ParentNode = document): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isNavigable);
}

/** Mark an element as navigable and make it focusable by the engine. */
export function makeFocusable(el: HTMLElement): HTMLElement {
  el.classList.add('focusable');
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  return el;
}

/** Currently focused navigable element, if any. */
export function currentFocus(): HTMLElement | null {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.classList.contains('focusable')) return active;
  return null;
}

/** Focus an element and keep it comfortably in view. */
export function setFocus(el: HTMLElement | null): void {
  if (!el) return;
  el.focus({ preventScroll: true });
  try {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  } catch {
    el.scrollIntoView();
  }
}

/** Focus the first navigable element inside `root` (or a preferred one). */
export function focusFirst(root: ParentNode = document): void {
  const all = focusables(root);
  const preferred = all.find((el) => el.hasAttribute('data-autofocus'));
  setFocus(preferred ?? all[0] ?? null);
}

/**
 * Score a candidate for a move in `dir`. Lower is better; null means the
 * candidate is not in that direction at all.
 */
function score(dir: Direction, from: Rect, to: Rect): number | null {
  let primary: number;
  let ortho: number;
  let overlaps: boolean;

  switch (dir) {
    case 'left':
      primary = from.cx - to.cx;
      ortho = Math.abs(to.cy - from.cy);
      overlaps = to.bottom > from.top && to.top < from.bottom;
      break;
    case 'right':
      primary = to.cx - from.cx;
      ortho = Math.abs(to.cy - from.cy);
      overlaps = to.bottom > from.top && to.top < from.bottom;
      break;
    case 'up':
      primary = from.cy - to.cy;
      ortho = Math.abs(to.cx - from.cx);
      overlaps = to.right > from.left && to.left < from.right;
      break;
    case 'down':
      primary = to.cy - from.cy;
      ortho = Math.abs(to.cx - from.cx);
      overlaps = to.right > from.left && to.left < from.right;
      break;
  }

  if (primary <= 1) return null; // Not in the requested direction.

  // Weight orthogonal drift heavily so rows/columns feel stable; candidates
  // whose extents overlap the current element on the cross axis win ties.
  return primary + ortho * 3 + (overlaps ? 0 : 1500);
}

/** Move focus one step in the given direction. Returns the new focus target. */
export function moveFocus(dir: Direction, root: ParentNode = document): HTMLElement | null {
  const all = focusables(root);
  if (all.length === 0) return null;

  const current = currentFocus();
  if (!current) {
    focusFirst(root);
    return currentFocus();
  }

  const from = rectOf(current);
  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const candidate of all) {
    if (candidate === current) continue;
    const s = score(dir, from, rectOf(candidate));
    if (s !== null && s < bestScore) {
      bestScore = s;
      best = candidate;
    }
  }

  if (best) setFocus(best);
  return best;
}
