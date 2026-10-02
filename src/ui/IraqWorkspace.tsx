import { useEffect, useState } from 'react';
import { IRAQ_CUSTOM_PRESETS, customizerState } from '../templates/iraq-custom-scene';
import { IraqCustomizer } from './IraqCustomizer';
import { IraqTimeline } from './IraqTimeline';

export function readIraqRoute(hash: string): { timeline: boolean; presetId: string } {
  let route = '';
  try { route = decodeURIComponent(hash.replace(/^#\/?/, '')); } catch { /* Fall back safely. */ }
  const [page, requested] = route.split('/');
  return { timeline: page === 'iraq-timeline', presetId: IRAQ_CUSTOM_PRESETS.some((p) => p.id === requested) ? requested : IRAQ_CUSTOM_PRESETS[0].id };
}
/** Shared website/offline history and editor entry; URL navigation is a real preset selection. */
export function IraqWorkspace() {
  const [route, setRoute] = useState(() => readIraqRoute(typeof location === 'undefined' ? '' : location.hash));
  useEffect(() => {
    const update = () => setRoute(readIraqRoute(location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const open = (presetId: string) => { location.hash = `/iraq-customizer/${encodeURIComponent(presetId)}`; };
  return <section aria-label="Iraq plates and history" style={{ width: '100%', minWidth: 0 }}>
    <nav aria-label="Iraq workspace" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <a href="#/iraq-timeline" aria-current={route.timeline ? 'page' : undefined}>Iraq timeline &amp; sources</a>
      <a href={`#/iraq-customizer/${route.presetId}`} aria-current={!route.timeline ? 'page' : undefined}>Custom plate editor</a>
    </nav>
    {route.timeline ? <IraqTimeline onOpenPreset={open} /> : <IraqCustomizer key={route.presetId} initialState={customizerState(route.presetId)} />}
  </section>;
}
