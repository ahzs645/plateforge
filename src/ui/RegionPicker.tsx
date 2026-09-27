import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Region } from '../core/types';
import { CheckIcon, CloseIcon, SearchIcon } from './icons';

interface Props {
  open: boolean;
  regions: Region[];
  selected: string;
  onSelect(id: string): void;
  onClose(): void;
}

/** Command-palette style picker. Centered dialog on desktop, full-screen sheet on mobile. */
export function RegionPicker({ open, regions, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter((r) => `${r.name} ${r.code} ${r.group}`.toLowerCase().includes(q));
  }, [regions, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Region[]>();
    for (const r of matches) map.set(r.group, [...(map.get(r.group) ?? []), r]);
    return [...map.entries()];
  }, [matches]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const i = regions.findIndex((r) => r.id === selected);
    setCursor(Math.max(0, i));
    // Focus after the sheet is painted so mobile keyboards open reliably.
    requestAnimationFrame(() => inputRef.current?.focus());
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, regions, selected]);

  useEffect(() => setCursor(0), [query]);

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
  return (
    <div className="picker-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="picker" role="dialog" aria-modal="true" aria-label="Choose a region" onKeyDown={onKeyDown}>
        <div className="picker-search">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search states, countries, codes…"
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
        <div className="picker-list" id="picker-list" ref={listRef} role="listbox">
          {groups.map(([group, list]) => (
            <section key={group}>
              <h3>
                {group}
                <span>{list.length}</span>
              </h3>
              {list.map((r) => {
                index++;
                const i = index;
                return (
                  <button
                    key={r.id}
                    role="option"
                    aria-selected={r.id === selected}
                    data-active={i === cursor}
                    className="picker-item"
                    onMouseMove={() => cursor !== i && setCursor(i)}
                    onClick={() => choose(r)}
                  >
                    <span className="flag" aria-hidden="true">{r.flag}</span>
                    <span className="picker-name">{r.name}</span>
                    {r.formats.length > 1 && <span className="picker-meta">{r.formats.length} formats</span>}
                    <kbd>{r.code}</kbd>
                    {r.id === selected && <CheckIcon />}
                  </button>
                );
              })}
            </section>
          ))}
          {!matches.length && <p className="picker-empty">Nothing matches “{query}”.</p>}
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
