import { useSyncExternalStore } from 'react';
import { researchDiesEnabled, researchDiesVersion, researchRegistryLoaded, setResearchDiesEnabled, subscribeResearchDies } from '../templates/dies/research-dies';

/** Re-renders when research dies load or are switched on or off. */
export const useResearchDiesVersion = (): number => useSyncExternalStore(subscribeResearchDies, researchDiesVersion, researchDiesVersion);

/** B.C. only: switch between the source-led research glyphs and the earlier production dies. */
export function ResearchDiesToggle() {
  useResearchDiesVersion();
  const on = researchDiesEnabled();
  return (
    <div className="field wide research-dies">
      <label className="research-dies-check">
        <input type="checkbox" checked={on} onChange={(e) => setResearchDiesEnabled(e.target.checked)} />
        Research lettering
      </label>
      <p className="research-dies-note">
        {!researchRegistryLoaded() ? 'Loading research glyphs…'
          : on ? 'Glyphs traced from source photos where observed; other characters use the earlier dies. Unvalidated research candidates.'
          : 'Showing the earlier production dies.'}
      </p>
    </div>
  );
}
