import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Region } from '../core/types';
import { countryOf, groupByCountry } from '../core/timeline';
import { CheckIcon, CloseIcon, SearchIcon } from './icons';

interface Props {
  open: boolean;
  regions: Region[];
  selected: string;
  onSelect(id: string): void;
  onClose(): void;
}

/** Command-palette style picker, organised continent → country → region.
 *  Centered dialog on desktop, full-screen sheet on mobile. */
export function RegionPicker({ open, regions, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCountry('');
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
    setCursor(!query && i >= 0 ? i : 0);
    // Only re-anchor when the visible set changes, not on every hover.
  }, [query, country, open]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor, open]);

  if (!open) return null;

  const choose = (r: Region | undefined) => {
    if (!r) return;
    onSelect(r.id);
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(matches.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
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
    return (
      <button
        key={r.id}
        role="option"
        aria-selected={r.id === selected}
        data-active={i === cursor}
        className={`picker-item ${nested ? 'nested' : ''}`}
        onMouseMove={() => cursor !== i && setCursor(i)}
        onClick={() => choose(r)}
      >
        {!nested && <span className="flag" aria-hidden="true">{r.flag}</span>}
        <span className="picker-name">{r.name}</span>
        {r.formats.length > 1 && <span className="picker-meta">{r.formats.length} formats</span>}
        <kbd>{r.code}</kbd>
        {r.id === selected && <CheckIcon />}
      </button>
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
        <footer className="picker-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </footer>
      </div>
    </div>
  );
}
