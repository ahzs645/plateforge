import { useState } from 'react';
import { generateBatch, getRegions } from '../core/registry';
import { countryOf, regionsInCountry } from '../core/timeline';
import type { Plate, PlateFormat, Region } from '../core/types';
import { batchToCsv, batchToJson, download } from './exporting';
import { DownloadIcon, ShuffleIcon } from './icons';
import { PlateView } from './PlateView';

type Scope = 'format' | 'country' | 'group' | 'all';

interface Props {
  region: Region;
  format: PlateFormat;
  onPick(plate: Plate): void;
}

export function BatchView({ region, format, onPick }: Props) {
  const [count, setCount] = useState(24);
  const [seed, setSeed] = useState('');
  const [scope, setScope] = useState<Scope>('format');
  const [plates, setPlates] = useState<Plate[]>([]);

  const run = () => {
    const all = getRegions();
    const source =
      scope === 'format'
        ? { region, format }
        : { regionPool: scope === 'country' ? regionsInCountry(all, region) : scope === 'group' ? all.filter((r) => r.group === region.group) : all };
    setPlates(generateBatch(count, seed, source));
  };

  const stamp = `${scope === 'format' ? region.id : scope}-${count}${seed ? `-${seed}` : ''}`;

  return (
    <div className="batch">
      <div className="batch-bar">
        <div className="field scope">
          <label htmlFor="batch-scope">Source</label>
          <div className="select">
            <select id="batch-scope" value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
              <option value="format">
                {region.name} — {format.label}
              </option>
              <option value="country">Every format in {countryOf(region)}</option>
              <option value="group">Every country in {region.group}</option>
              <option value="all">Every region</option>
            </select>
          </div>
        </div>
        <div className="field count">
          <label htmlFor="batch-count">Count</label>
          <div className="select">
            <select id="batch-count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[12, 24, 48, 96, 200].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field seed">
          <label htmlFor="batch-seed">Seed</label>
          <input id="batch-seed" className="mono" value={seed} placeholder="random" onChange={(e) => setSeed(e.target.value)} spellCheck={false} autoComplete="off" />
        </div>
        <div className="batch-actions">
          <button className="btn primary" onClick={run}>
            <ShuffleIcon /> Generate
          </button>
          <button className="btn" disabled={!plates.length} onClick={() => download(new Blob([batchToCsv(plates)], { type: 'text/csv' }), `plates-${stamp}.csv`)}>
            <DownloadIcon /> CSV
          </button>
          <button className="btn" disabled={!plates.length} onClick={() => download(new Blob([batchToJson(plates)], { type: 'application/json' }), `plates-${stamp}.json`)}>
            <DownloadIcon /> JSON
          </button>
        </div>
      </div>

      {plates.length > 0 ? (
        <>
          <p className="batch-summary">
            {plates.length} plates{seed ? <> · seed <code>{seed}</code></> : ' · unseeded'} · tap a plate to edit it
          </p>
          <ul className="batch-grid">
            {plates.map((p, i) => (
              <li key={i}>
                <button className="batch-card" onClick={() => onPick(p)}>
                  <PlateView plate={p} className="thumb" />
                  <span className="batch-text mono">{p.text}</span>
                  <span className="batch-meta">
                    {p.region.flag} {p.region.name} · {p.format.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="batch-empty">
          <p className="batch-empty-title">Generate many plates at once</p>
          <p>
            Choose a source and count. Add a seed to get the same batch every time, which is useful for fixtures and tests.
          </p>
          <button className="btn primary" onClick={run}>
            <ShuffleIcon /> Generate {count} plates
          </button>
        </div>
      )}
    </div>
  );
}
