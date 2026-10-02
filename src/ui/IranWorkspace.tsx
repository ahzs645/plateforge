import { memo, useCallback, useEffect, useReducer, useState } from 'react';
import { IRAN_CUSTOM_PRESETS, IRAN_CUSTOM_PRESET_ALIASES } from '../templates/iran-custom-scene';
import { createIranEditorSession, IranCustomizer, iranEditorReducer } from './IranCustomizer';
import { IranTimeline } from './IranTimeline';

const MemoIranTimeline = memo(IranTimeline);

export function readIranRoute(hash: string): { timeline: boolean; presetId: string } {
  let route = '';
  try { route = decodeURIComponent(hash.replace(/^#\/?/, '')); } catch { /* Malformed shared URLs fall back safely. */ }
  const [page, requested] = route.split('/');
  // The state factory also resolves the catalogue's legacy format aliases.
  const presetId = page === 'iran-customizer' && requested ? (IRAN_CUSTOM_PRESET_ALIASES[requested] ?? requested) : IRAN_CUSTOM_PRESETS[0].id;
  return { timeline: page === 'iran-timeline', presetId: IRAN_CUSTOM_PRESETS.some(preset => preset.id === presetId) ? presetId : IRAN_CUSTOM_PRESETS[0].id };
}
export function IranWorkspace() {
  const [route, setRoute] = useState(() => readIranRoute(typeof location === 'undefined' ? '' : location.hash));
  const [timelineVisited, setTimelineVisited] = useState(route.timeline);
  const [session, dispatch] = useReducer(iranEditorReducer, route.presetId, createIranEditorSession);
  useEffect(() => {
    const update = () => {
      const next = readIranRoute(location.hash);
      setRoute(next);
      if (next.timeline) setTimelineVisited(true);
      if (!next.timeline && /^#\/?iran-customizer\/[^/]+/.test(location.hash)) dispatch({ type: 'select', presetId: next.presetId });
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const open = useCallback((presetId: string) => {
    dispatch({ type: 'select', presetId });
    location.hash = `/iran-customizer/${encodeURIComponent(presetId)}`;
  }, []);
  return <section className="iran-workspace" aria-label="Iran plates and history" style={{ width: '100%', minWidth: 0 }}>
    <nav className="iran-workspace-nav" aria-label="Iran workspace"><a href="#/iran-timeline" aria-current={route.timeline ? 'page' : undefined}>Iran timeline &amp; sources</a><a href={`#/iran-customizer/${session.current.presetId}`} aria-current={!route.timeline ? 'page' : undefined}>Custom plate editor</a></nav>
    {timelineVisited && <div hidden={!route.timeline}><MemoIranTimeline onOpenPreset={open} /></div>}
    <div hidden={route.timeline}><IranCustomizer session={session} dispatch={dispatch} onSelectPreset={open} /></div>
  </section>;
}
