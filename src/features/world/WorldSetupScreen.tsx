import React, { useEffect, useMemo, useState } from 'react';
import { rng } from "../../core/services/random";
import { _storage } from "../../core/services/storage";
import { Engine, Preset } from '../../engine.d';

type Props = { eng: Engine; onNext: () => void };

export function WorldSetupScreen({ eng, onNext }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [chosen, setChosen] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [seed, setSeed] = useState<string>(eng?.state?.meta?.seed || '');

  console.log('WorldSetupScreen render:', { presets, chosen });

  useEffect(() => {
    async function loadPresets() {
      try {
        console.log('Loading presets...');
        await eng?.loadWorldPresets?.();
        const list = eng?.state?.meta?.presets?.list || [];
        setPresets(list);
        console.log('Loaded presets:', list);
      } catch (e) {
        console.error('Failed to load presets', e);
        setError('Could not load world presets.');
      }
    }
    loadPresets();
  }, [eng]);

  // Sync seed from engine if it changes elsewhere (e.g., restored from localStorage)
  useEffect(() => {
    const s = eng?.state?.meta?.seed || '';
    if (s && s !== seed) setSeed(s);
  }, [eng?.state?.meta?.seed]);

  // When preset changes, if it has a default seed and no manual seed has been set, apply it
  useEffect(() => {
    const presetSeed = presets.find(p => p.name === chosen)?.seed;
    if (!seed && presetSeed) {
      setSeed(presetSeed);
      eng?.setSeed?.(presetSeed);
    }
  }, [chosen, presets]);

  // Generate a new random seed
  const makeRandomSeed = useMemo(() => () => {
    const t = Date.now().toString(36);
    const r = rng.next().toString(36).slice(2, 8);
    const s = `${t}-${r}`;
    setSeed(s);
    eng?.setSeed?.(s);
  }, [eng]);

  const current = presets.find((p) => p?.name === chosen);

  return (
    <div>
      <h2>World Setup</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div>
        <label>Choose a preset world: </label>
        <select
          value={chosen}
          onChange={(e) => {
            const v = e.target.value;
            setChosen(v);
            eng?.applyPresetByName?.(v);
          }}
        >
          <option value=''>-- none --</option>
          {presets.map((p) => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="seed">World seed: </label>
          <input
            id="seed"
            type="text"
            value={seed}
            onChange={(e) => {
              setSeed(e.target.value);
              eng?.setSeed?.(e.target.value);
            }}
            placeholder="random-seed"
            style={{ width: 260 }}
          />
          <button type="button" style={{ marginLeft: 8 }} onClick={makeRandomSeed}>
            Randomize
          </button>
        </div>

        {current?.description && (
          <p style={{ marginTop: 8, opacity: 0.8 }}>{current.description}</p>
        )}
        {current?.factions?.length ? (
          <div style={{ marginTop: 6, fontSize: 12 }}>
            Factions: {current.factions.join(' • ')}
          </div>
        ) : null}
      </div>

      <button onClick={onNext} disabled={!chosen && !seed}>Next: Create Characters</button>
    </div>
  );
}