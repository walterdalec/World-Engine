import React from 'react';
import { DIFFICULTY_PRESETS } from '../ai/difficulty/presets';

interface Props {
  world: any;
  onChange: (id: string, overrides?: any) => void;
}

export function SettingsAIDifficulty({ world, onChange }: Props) {
  const ids = Object.keys(DIFFICULTY_PRESETS);
  const currentId = world?.aiDifficulty?.current?.id ?? 'Normal';
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold">AI Difficulty</label>
      <select
        className="border border-slate-500 bg-slate-900 p-2 rounded text-sm"
        value={currentId}
        onChange={(event) => onChange(event.target.value)}
      >
        {ids.map(id => (
          <option key={id} value={id}>{DIFFICULTY_PRESETS[id].label}</option>
        ))}
      </select>
      <p className="text-xs opacity-70">{DIFFICULTY_PRESETS[currentId].description}</p>
    </div>
  );
}
