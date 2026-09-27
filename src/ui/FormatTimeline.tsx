import { useEffect, useRef } from 'react';
import { formatPeriod, gapsFor, stepTimeline, type Timeline, type TimelineEra } from '../core/timeline';
import type { PlateFormat, Region } from '../core/types';
import { ChevronLeft, ChevronRight, GridIcon } from './icons';
import { PlateView } from './PlateView';
import { samplePlate } from './samples';
import './timeline.css';

interface Props {
  region: Region;
  timeline: Timeline;
  format: PlateFormat;
  onSelect(formatId: string): void;
  onOpenGallery(): void;
}

/** Horizontal filmstrip of every dated format, grouped into eras. */
export function FormatTimeline({ region, timeline, format, onSelect, onOpenGallery }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const position = timeline.order.findIndex((e) => e.format.id === format.id);
  const era = timeline.eras.find((e) => e.entries.some((entry) => entry.format.id === format.id));
  const entry = timeline.order[position];
  const prev = stepTimeline(timeline, format.id, -1);
  const next = stepTimeline(timeline, format.id, 1);
  // Built eras and documented-but-unbuilt gaps share one chronological axis.
  const items = [...timeline.eras.map((era) => ({ kind: 'era' as const, start: era.period[0], era })),
    ...gapsFor(region, timeline.family).map((gap) => ({ kind: 'gap' as const, start: gap.period[0], gap }))].sort((a, b) => a.start - b.start);

  useEffect(() => {
    const track = trackRef.current;
    const node = track?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!track || !node) return;
    // Centre the active node without scrolling the page vertically.
    const left = node.offsetLeft - track.clientWidth / 2 + node.offsetWidth / 2;
    track.scrollTo({ left, behavior: 'smooth' });
  }, [format.id]);

  const renderEra = (e: TimelineEra) => (
    <div key={e.id} className="timeline-era" data-active={e.id === era?.id}>
      <div className="timeline-era-label" title={e.summary}>
        <span className="mono">{formatPeriod(e.period)}</span> {e.label}
      </div>
      <ol className="timeline-nodes">
        {e.entries.map(({ format: f, period }) => (
          <li key={f.id}>
            <button className="timeline-node" aria-current={f.id === format.id} onClick={() => onSelect(f.id)} title={f.label}>
              <PlateView plate={samplePlate(region, f)} className="timeline-thumb" />
              <span className="timeline-year mono">{formatPeriod(period)}</span>
              {f.label !== formatPeriod(period) && <span className="timeline-variant">{f.label.replace(/^\d{4}(?:–\d{4})?\s*·\s*/, '')}</span>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <section className="timeline" aria-label={`${region.name} plate timeline`}>
      <header className="timeline-head">
        <div className="timeline-title">
          <span className="timeline-span">{formatPeriod(timeline.span)}</span>
          <span className="timeline-count">{timeline.order.length} designs · {timeline.eras.length} eras</span>
        </div>
        <div className="timeline-nav">
          <button className="icon-btn" disabled={!prev} onClick={() => prev && onSelect(prev.id)} aria-label="Previous design" title="Previous design (←)"><ChevronLeft /></button>
          <span className="timeline-pos mono">{position + 1}/{timeline.order.length}</span>
          <button className="icon-btn" disabled={!next} onClick={() => next && onSelect(next.id)} aria-label="Next design" title="Next design (→)"><ChevronRight /></button>
          <button className="btn timeline-gallery" onClick={onOpenGallery}><GridIcon /> Gallery</button>
        </div>
      </header>
      <div className="timeline-track" ref={trackRef}>
        {items.map((item) => item.kind === 'gap' ? (
          <div key={item.gap.id} className="timeline-era timeline-gap">
            <div className="timeline-era-label"><span className="mono">{formatPeriod(item.gap.period)}</span> {item.gap.label}</div>
            <a className="timeline-gap-node" href={region.coverageRoute ?? item.gap.sources[0]?.url} {...(region.coverageRoute ? {} : { target: '_blank', rel: 'noreferrer' })}
              title={item.gap.note ?? 'Documented, not yet reconstructed'}>
              <span>Not built yet</span>
              <span className="timeline-variant">{region.coverageRoute ? 'See coverage' : 'Source chapter ↗'}</span>
            </a>
          </div>
        ) : renderEra(item.era))}
      </div>
      {era && entry && <p className="timeline-caption">
        <strong>{era.label}</strong> <span className="mono">{formatPeriod(era.period)}</span>{era.summary ? ` — ${era.summary}` : ''}
      </p>}
    </section>
  );
}
