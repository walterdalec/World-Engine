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
    <div style={{ padding: '24px' }}>
      <h2>Party Creation</h2>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.85 }}>
        <div>World: <strong>{selected || '—'}</strong></div>
        <div>Seed: <code>{seed || '—'}</code></div>
      </div>
      <p>Build your adventuring party for the world ahead.</p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button 
          onClick={onStart}
          style={{ 
            padding: '12px 24px', 
            background: '#059669', 
            color: '#f9fafb', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Create Character
        </button>
      </div>
    </div>
  );
}
