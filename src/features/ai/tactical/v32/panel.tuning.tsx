import React, { useState } from 'react';

export type Coeffs = { kAtk: number; kDef: number; kRange: number; kFocus: number; rounds: number };

interface Props {
  coeffs: Coeffs;
  onChange: (_coeffs: Coeffs) => void;
}

export function AutoResolveTuningPanel({ coeffs, onChange }: Props) {
  const [local, setLocal] = useState<Coeffs>(coeffs);

  const update = (key: keyof Coeffs, value: number) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    onChange(next);
  };

  const fields: Array<{ key: keyof Coeffs; min: number; max: number; step: number }> = [
    { key: 'kAtk', min: 0.5, max: 1.5, step: 0.01 },
    { key: 'kDef', min: 0.5, max: 1.5, step: 0.01 },
    { key: 'kRange', min: 0, max: 0.3, step: 0.005 },
    { key: 'kFocus', min: 0, max: 0.2, step: 0.005 },
    { key: 'rounds', min: 6, max: 12, step: 1 },
  ];

  return (
    <div className="p-3 grid grid-cols-1 gap-2 text-sm bg-slate-900/60 rounded">
      {fields.map(({ key, min, max, step }) => (
        <label key={key} className="flex items-center gap-2">
          <span className="w-20 capitalize">{key}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={local[key]}
            onChange={(event) => update(key, parseFloat(event.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right">{key === 'rounds' ? local[key] : local[key].toFixed(2)}</span>
        </label>
      ))}
    </div>
  );
}
