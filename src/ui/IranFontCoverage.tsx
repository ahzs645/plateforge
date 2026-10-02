import { IRAN_FONT_PROFILES, IRAN_WORDMARKS, type IranFontProfile, type IranGlyph } from '../templates/iran-custom-fonts';

const provenanceLabels = { observed: 'Observed source form', inferred: 'Inferred numeral completion', candidate: 'Licensed typography candidate', fallback: 'Explicit fallback', unsupported: 'Unsupported' };
/** Use glyph-map keys, not a concatenated coverage string: هـ is one atomic token. */
export function iranProfileCoverage(profile: IranFontProfile) {
  return {
    main: Object.entries(profile.glyphs),
    roles: Object.entries(profile.roles ?? {}).map(([id, role]) => ({
      id,
      label: role.label ?? id.replace(/[-_]/g, ' '),
      capHeight: role.capHeight,
      glyphs: Object.entries(role.glyphs),
      provenance: [...new Set(Object.values(role.glyphs).map(glyph => glyph.provenance))],
      sources: [...new Set(Object.values(role.glyphs).map(glyph => glyph.sourceId))],
      notes: [...new Set(Object.values(role.glyphs).flatMap(glyph => glyph.note ? [glyph.note] : []))],
    })),
    wordmarks: Object.entries(profile.wordmarks),
  };
}
function GlyphTokens({ glyphs, label, capHeight = 100 }: { glyphs: [string, IranGlyph][]; label: string; capHeight?: number }) {
  // One shared design space per set retains raised zeroes, overshoots and relative widths.
  // Individual tokens are never stretched to fill their thumbnail cell.
  const x = Math.min(-6, ...glyphs.map(([, glyph]) => glyph.bounds.x - 6));
  const top = Math.min(-capHeight - 8, ...glyphs.map(([, glyph]) => glyph.bounds.y - 8));
  const width = Math.max(40, ...glyphs.map(([, glyph]) => Math.max(glyph.advance + 6, glyph.bounds.x + glyph.bounds.width + 6))) - x;
  const height = Math.max(16, ...glyphs.map(([, glyph]) => glyph.bounds.y + glyph.bounds.height + 8)) - top;
  return glyphs.length ? <ul className="inc-token-list" aria-label={label}>{glyphs.map(([token, glyph]) => {
    return <li key={token} data-coverage-token={token} title={`${token} · ${glyph.provenance} · ${glyph.sourceId}${glyph.note ? ` · ${glyph.note}` : ''}`}>
      <svg viewBox={`${x} ${top} ${width} ${height}`} role="img" aria-label={`${token} · ${provenanceLabels[glyph.provenance]}`}><path d={glyph.path} fill="currentColor" fillRule={glyph.fillRule} /></svg>
      <span dir="auto">{token}</span><small>{glyph.provenance}</small>
    </li>;
  })}</ul> : <p className="inc-small">No outlines supplied for this set.</p>;
}
export const iranRoleOnlyProfiles = (profiles: IranFontProfile[]): IranFontProfile[] => profiles.filter(profile =>
  Object.keys(profile.glyphs).length === 0 && (Object.keys(profile.roles ?? {}).length > 0 || Object.keys(profile.wordmarks).length > 0));
const availableRoleMasters = iranRoleOnlyProfiles(Object.values(IRAN_FONT_PROFILES));
/** Main alphabet, position-specific outlines and complete joined labels are separate inventories. */
export function IranFontCoverage({ profile, roleOnlyProfiles = availableRoleMasters }: { profile: IranFontProfile; roleOnlyProfiles?: IranFontProfile[] }) {
  const coverage = iranProfileCoverage(profile);
  return <div className="inc-font-coverage">
    <section className="inc-main-coverage" aria-label="Main profile glyph coverage"><h3>Main-profile coverage · {coverage.main.length} {coverage.main.length === 1 ? 'token' : 'tokens'}</h3>
      <p className="inc-small">These are the embedded main glyph outlines. This list does not include separate year-tab, city-initial, code or Latin-role forms. A token is not a promise of a complete historical alphabet.</p>
      <GlyphTokens glyphs={coverage.main} label="Available main glyph tokens" capHeight={profile.capHeight} />
      <p className="inc-small">Numeral input aliases use this profile’s own script. Joined tokens such as هـ remain one form.</p>
    </section>
    <section className="inc-role-coverage" aria-label="Layout-role coverage"><h3>Layout-role coverage · {coverage.roles.length} separate {coverage.roles.length === 1 ? 'set' : 'sets'}</h3>
      <p className="inc-small">Role outlines are tied to their documented position. A year-tab digit does not fill a missing main serial digit, and a main glyph does not fill a missing role in strict mode.</p>
      {coverage.roles.length ? <div className="inc-role-list">{coverage.roles.map(role => <article className="inc-role-card" key={role.id} data-coverage-role={role.id}>
        <div className="inc-section-heading"><h4>{role.label}</h4><span className="inc-badge">{role.glyphs.length} {role.glyphs.length === 1 ? 'token' : 'tokens'}</span></div>
        <div className="inc-role-provenance">{role.provenance.map(value => <span className="inc-badge" key={value}>{provenanceLabels[value]}</span>)}</div>
        <GlyphTokens glyphs={role.glyphs} label={`${role.label} glyph tokens`} capHeight={role.capHeight} />
        {role.notes.length > 0 && <ul className="inc-notes">{role.notes.map(note => <li key={note}>{note}</li>)}</ul>}
        {role.sources.length > 0 && <details className="inc-role-sources"><summary>Outline source IDs</summary><ul>{role.sources.map(source => <li key={source}>{source}</li>)}</ul></details>}
      </article>)}</div> : <p className="inc-small">This selected profile has no separate layout-role sets.</p>}
      <p className="inc-small">Fixed legends and alternate-script labels can use other source-guided or licensed role masters. The scene’s source / lettering notices identify those choices; selecting a main profile does not replace every word on the plate.</p>
    </section>
    <details className="inc-wordmarks"><summary>Whole-word coverage · {coverage.wordmarks.length} supplied {coverage.wordmarks.length === 1 ? 'form' : 'forms'}</summary>
      <p className="inc-small">These are complete joined outlines. They are not additional isolated-letter alphabet coverage.</p>
      {coverage.wordmarks.length ? <ul>{coverage.wordmarks.map(([id, word]) => <li key={id}><span>{IRAN_WORDMARKS[id]?.label ?? id}</span><span dir="rtl">{word.text}</span><span className="inc-badge">{word.provenance}</span></li>)}</ul> : <p>No complete joined wordmarks are supplied in this profile. Choose a covered profile or explicitly enable fallback where supported.</p>}
    </details>
    {roleOnlyProfiles.length > 0 && <details className="inc-role-masters"><summary>Role-only master library · {roleOnlyProfiles.length} {roleOnlyProfiles.length === 1 ? 'profile' : 'profiles'}</summary>
      <p className="inc-small">These available fixed-role masters are not main-font choices and do not provide a main alphabet. This inventory does not mean every master is used by the current scene; check its source / lettering notices.</p>
      <div className="inc-role-list">{roleOnlyProfiles.map(master => <article key={master.id} className="inc-role-card" data-role-only-profile={master.id}>
        <h4>{master.label}</h4><span className="inc-badge">{provenanceLabels[master.provenance]}</span>
        {Object.entries(master.roles ?? {}).map(([roleId, role]) => <div key={roleId}><p className="inc-small">{role.label ?? roleId.replace(/[-_]/g, ' ')}</p><GlyphTokens glyphs={Object.entries(role.glyphs)} label={`${master.label} · ${role.label ?? roleId}`} capHeight={role.capHeight} /></div>)}
        {Object.keys(master.wordmarks).length > 0 && <ul className="inc-role-words">{Object.entries(master.wordmarks).map(([wordId, word]) => <li key={wordId}><span>{IRAN_WORDMARKS[wordId]?.label ?? wordId}</span><span dir="rtl">{word.text}</span><span className="inc-badge">{word.provenance}</span><small>{word.sourceId}</small></li>)}</ul>}
        {master.notes.length > 0 && <ul className="inc-notes">{master.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>}
        <p className="inc-small">{master.rights}</p>{master.sourceUrl && <a href={master.sourceUrl} target="_blank" rel="noreferrer">Master source ↗</a>}
      </article>)}</div>
    </details>}
  </div>;
}
