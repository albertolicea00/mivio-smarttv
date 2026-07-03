/** Tiny DOM helpers to keep screen code readable without a framework. */

type Child = Node | string | null | undefined;

export interface ElProps {
  className?: string;
  text?: string;
  attrs?: Record<string, string>;
  onClick?: (event: Event) => void;
}

/** Create an element with class, text, attributes and children in one call. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  if (props.attrs) {
    for (const [key, value] of Object.entries(props.attrs)) {
      node.setAttribute(key, value);
    }
  }
  if (props.onClick) node.addEventListener('click', props.onClick);
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Remove all children of a node. */
export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Format runtime ticks (Jellyfin: 10,000,000 ticks per second) as "1h 32m". */
export function formatRuntime(ticks: number | undefined): string {
  if (!ticks) return '';
  const totalMinutes = Math.round(ticks / 10_000_000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** Format seconds as "h:mm:ss" or "m:ss". */
export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
