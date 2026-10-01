import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createRng } from '../core/random';
import { makePlate } from '../core/registry';
import type { PlateFormat, Region } from '../core/types';
import { countryOf, formatPeriod, groupByCountry, regionFamilies, statusBadge } from '../core/timeline';
import { CheckIcon, ChevronDown, CloseIcon, SearchIcon } from './icons';
import { PlateView } from './PlateView';

interface Props {
  open: boolean;
  regions: Region[];
  selected: string;
  selectedFormat?: string;
  /** `format` is set when a specific design was picked rather than the region as a whole. */
  onSelect(id: string, format?: string): void;
  onClose(): void;
}

interface OptionGroup { id: string; label: string; formats: PlateFormat[] }

/** A region's designs grouped by family, in declaration order; one unlabelled group when it has no families. */
function optionGroups(region: Region): OptionGroup[] {
  const families = regionFamilies(region);
  return families.length ? families : [{ id: 'all', label: '', formats: region.formats }];
}

/** A stable sample serial per design, so the preview doesn't reshuffle while pointing around. */
function sample(region: Region, format: PlateFormat) {
  return makePlate(region, format, format.generate(createRng(`${region.id}/${format.id}`)));
}

function OptionList({ region, groups, active, selected, onPick, onHover }: {
  region: Region; groups: OptionGroup[]; active: number; selected?: string;
  onPick(format: PlateFormat): void; onHover(index: number): void;
}) {
  let index = -1;
  return (
    <div className="picker-options-list" role="listbox" aria-label={`${region.name} designs`}>
      {groups.map((g) => (
        <div key={g.id} role="group" aria-label={g.label || region.name}>
          {g.label && <h5>{g.label}<span>{g.formats.length}</span></h5>}
          {g.formats.map((f) => {
            index++;
            const i = index;
            const badge = statusBadge(f);
            return (
              <button
                key={f.id}
                role="option"
                aria-selected={f.id === selected}
                data-active={i === active}
                className="picker-option"
                onMouseMove={() => i !== active && onHover(i)}
                onClick={() => onPick(f)}
              >
                <span className="picker-option-name">{f.label}</span>
                {badge && <span className="status-badge">{badge}</span>}
                {f.period && <span className="picker-meta">{formatPeriod(f.period)}</span>}
                {f.id === selected && <CheckIcon />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Command-palette style picker, organised continent → country → region, with the highlighted region's designs
 *  alongside. Centered dialog on desktop (designs in a side pane), full-screen sheet on mobile (designs expand inline). */
export function RegionPicker({ open, regions, selected, selectedFormat, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [cursor, setCursor] = useState(0);
  /** Index into the active region's designs once the keyboard has moved into the side pane (→), else null. */
  const [option, setOption] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  /** Set when the cursor moves by keyboard (or on open); hover only highlights and never scrolls the list. */
  const reveal = useRef<ScrollLogicalPosition | null>(null);

  const all = useMemo(() => groupByCountry(regions), [regions]);
  const countries = useMemo(() => all.flatMap((c) => c.countries), [all]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.map((c) => ({
      ...c,
      countries: c.countries
        .filter((g) => !country || g.country === country)
        .map((g) => ({ ...g, regions: q ? g.regions.filter((r) => `${r.name} ${r.code} ${g.country} ${r.group}`.toLowerCase().includes(q)) : g.regions }))
        .filter((g) => g.regions.length),
    })).filter((c) => c.countries.length);
  }, [all, query, country]);
  // Keyboard order follows render order.
  const matches = useMemo(() => groups.flatMap((c) => c.countries.flatMap((g) => g.regions)), [groups]);

  const activeRegion = matches[cursor];
  const designGroups = useMemo(() => (activeRegion ? optionGroups(activeRegion) : []), [activeRegion]);
  const options = useMemo(() => designGroups.flatMap((g) => g.formats), [designGroups]);
  const previewIndex = option ?? hovered;
  const previewFormat = activeRegion && (options[previewIndex ?? -1]
    ?? (activeRegion.id === selected ? options.find((f) => f.id === selectedFormat) : undefined) ?? options[0]);
  const preview = useMemo(() => (activeRegion && previewFormat ? sample(activeRegion, previewFormat) : null), [activeRegion, previewFormat]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCountry('');
    setExpanded(null);
    // Focus after the sheet is painted so mobile keyboards open reliably.
    requestAnimationFrame(() => inputRef.current?.focus());
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const i = matches.findIndex((r) => r.id === selected);
    reveal.current = 'center';
    setCursor(!query && i >= 0 ? i : 0);
    // Only re-anchor when the visible set changes, not on every hover.
  }, [query, country, open]);

  // A new region resets the design cursor; the pane only takes the keyboard again on →.
  useEffect(() => { setOption(null); setHovered(null); }, [activeRegion?.id]);

  useEffect(() => {
    const block = reveal.current;
    reveal.current = null;
    if (!block) return;
    listRef.current?.querySelector('.picker-item[data-active="true"]')?.scrollIntoView({ block });
  }, [cursor, open, query, country]);
  useEffect(() => {
    if (option !== null) optionsRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [option]);

  if (!open) return null;

  const choose = (r: Region | undefined, format?: PlateFormat) => {
    if (!r) return;
    onSelect(r.id, format?.id);
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (option !== null) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setOption(Math.min(options.length - 1, option + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setOption(Math.max(0, option - 1)); }
      else if (e.key === 'ArrowLeft' || e.key === 'Escape') { e.preventDefault(); setOption(null); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(activeRegion, options[option]); }
      return;
    }
    // → steps into the designs when the caret is already at the end of the search text.
    const atEnd = !(e.target instanceof HTMLInputElement) || e.target.selectionStart === e.target.value.length;
    if (e.key === 'ArrowRight' && atEnd && options.length > 1) {
      e.preventDefault();
      const current = activeRegion?.id === selected ? options.findIndex((f) => f.id === selectedFormat) : -1;
      setOption(Math.max(0, current));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      reveal.current = 'nearest';
      setCursor((c) => Math.min(matches.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      reveal.current = 'nearest';
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(matches[cursor]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let index = -1;
  const item = (r: Region, nested: boolean) => {
    index++;
    const i = index;
    const open = expanded === r.id;
    return (
      <div key={r.id} className="picker-row">
        <div className="picker-row-main">
          <button
            role="option"
            aria-selected={r.id === selected}
            data-active={i === cursor}
            className={`picker-item ${nested ? 'nested' : ''}`}
            onMouseMove={() => cursor !== i && setCursor(i)}
            onClick={() => choose(r)}
          >
            {!nested && <span className="flag" aria-hidden="true">{r.flag}</span>}
            <span className="picker-name">{r.name}</span>
            {r.formats.length > 1 && <span className="picker-meta">{r.formats.length} designs</span>}
            <kbd>{r.code}</kbd>
            {r.id === selected && <CheckIcon />}
          </button>
          {r.formats.length > 1 && (
            <button className="icon-btn picker-expand" aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} ${r.name} designs`}
              onClick={() => { setExpanded(open ? null : r.id); setCursor(i); }}>
              <ChevronDown />
            </button>
          )}
        </div>
        {open && (
          <div className="picker-inline-options">
            <OptionList region={r} groups={optionGroups(r)} active={-1} selected={r.id === selected ? selectedFormat : undefined}
              onPick={(f) => choose(r, f)} onHover={() => {}} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="picker-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="picker" role="dialog" aria-modal="true" aria-label="Choose a region" onKeyDown={onKeyDown}>
        <div className="picker-search">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries, states, provinces, codes…"
            aria-label="Search regions"
            aria-controls="picker-list"
            enterKeyHint="go"
            autoComplete="off"
            spellCheck={false}
          />
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <nav className="picker-countries" aria-label="Filter by country">
          <button className="picker-country" aria-pressed={!country} onClick={() => setCountry('')}>All countries</button>
          {countries.map((g) => (
            <button key={g.country} className="picker-country" aria-pressed={country === g.country} onClick={() => setCountry(country === g.country ? '' : g.country)}>
              <span aria-hidden="true">{g.flag}</span> {g.country}
              {g.regions.length > 1 && <span className="picker-country-count">{g.regions.length}</span>}
            </button>
          ))}
        </nav>
        <div className="picker-body">
        <div className="picker-list" id="picker-list" ref={listRef} role="listbox">
          {groups.map((c) => (
            <section key={c.continent}>
              <h3>
                {c.continent}
                <span>{c.countries.length} {c.countries.length === 1 ? 'country' : 'countries'}</span>
              </h3>
              {c.countries.map((g) => {
                const national = g.regions.length === 1 && countryOf(g.regions[0]) === g.regions[0].name;
                if (national) return item(g.regions[0], false);
                return (
                  <div key={g.country} className="picker-country-group" role="group" aria-label={g.country}>
                    <h4>
                      <span aria-hidden="true">{g.flag}</span> {g.country}
                      <span>{g.regions.length} {g.regions.length === 1 ? 'region' : 'regions'}</span>
                    </h4>
                    {g.regions.map((r) => item(r, true))}
                  </div>
                );
              })}
            </section>
          ))}
          {!matches.length && <p className="picker-empty">Nothing matches “{query}”{country ? ` in ${country}` : ''}.</p>}
        </div>
        {activeRegion && (
          <aside className="picker-options" ref={optionsRef} aria-label={`${activeRegion.name} designs`} data-focused={option !== null}>
            <header>
              <span aria-hidden="true">{activeRegion.flag}</span>
              <strong>{activeRegion.name}</strong>
              <span>{options.length} {options.length === 1 ? 'design' : 'designs'}</span>
            </header>
            {preview && (
              <div className="picker-preview" aria-hidden="true">
                <PlateView plate={preview} />
                <span>{previewFormat!.label}</span>
              </div>
            )}
            <OptionList region={activeRegion} groups={designGroups} active={previewIndex ?? -1}
              selected={activeRegion.id === selected ? selectedFormat : undefined}
              onPick={(f) => choose(activeRegion, f)} onHover={setHovered} />
          </aside>
        )}
        </div>
        <footer className="picker-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>→</kbd> designs</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </footer>
      </div>
    </div>
  );
}
