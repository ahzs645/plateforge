import { useSyncExternalStore } from 'react';

let version = 0;
const listeners = new Set<() => void>();
let watched: FontFaceSet | null = null;
const notify = () => { version++; for (const listener of listeners) listener(); };
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof document !== 'undefined' && document.fonts && !watched) {
    watched = document.fonts;
    watched.addEventListener('loadingdone', notify);
    watched.addEventListener('loadingerror', notify);
    void watched.ready.then(notify);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && watched) {
      watched.removeEventListener('loadingdone', notify);
      watched.removeEventListener('loadingerror', notify);
      watched = null;
    }
  };
}
/** Redraw just the plate when a face or late Unicode subset arrives. Never remount the editor. */
export const usePlateFontsVersion = (): number => useSyncExternalStore(subscribe, () => version, () => 0);
export function nextPaint(doc: Document): Promise<void> {
  const view = doc.defaultView;
  return view ? new Promise((resolve) => view.requestAnimationFrame(() => view.requestAnimationFrame(() => resolve()))) : Promise.resolve();
}
export async function withFontTimeout<T>(promise: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Font loading timed out; retry after the font is available')), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}
