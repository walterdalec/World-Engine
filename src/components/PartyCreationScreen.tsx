import React from 'react';
import { Engine } from '../engine.d';

type PartyMember = { name: string; cls?: string; stats?: Record<string, number> };
type Props = { eng: Engine; party: PartyMember[]; setParty: (p: PartyMember[]) => void; onStart: () => void };

export function PartyCreationScreen({ eng, party, setParty, onStart }: Props) {
  const selected = (typeof eng.state.meta.presets.loaded === 'string')
    ? eng.state.meta.presets.loaded
    : eng.state.meta.presets.loaded?.name;
  const seed = eng.state.meta.seed || '';
  return (
    <div>
      <h2>Party Creation</h2>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.85 }}>
        <div>World: <strong>{selected || '—'}</strong></div>
        <div>Seed: <code>{seed || '—'}</code></div>
      </div>
      <p>Party creation screen - coming soon</p>
      <button onClick={onStart}>Start Adventure</button>
    </div>
  );
}
