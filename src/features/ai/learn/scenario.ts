export type ScenarioKey = string;

export interface ScenarioFeatures {
  cultures: [string, string];
  biome: string;
  siege: boolean;
  tier: number;
}

export function makeScenarioKey(features: ScenarioFeatures): ScenarioKey {
  const [a, b] = [...features.cultures].sort();
  return `${a}|${b}|${features.biome}|${features.siege ? 'Siege' : 'Field'}|T${Math.max(1, Math.min(3, features.tier))}`;
}

export function extractScenario(state: any): ScenarioFeatures {
  const cultureA = state?.factionA?.cultureId ?? state?.context?.cultureA ?? 'unknown';
  const cultureB = state?.factionB?.cultureId ?? state?.context?.cultureB ?? 'unknown';
  const biome = state?.environment?.biome ?? state?.context?.biome ?? 'Plains';
  const siege = Boolean(state?.siegeObjs && Object.keys(state.siegeObjs).length);
  const tier = estimateTier(state);
  return { cultures: [cultureA, cultureB], biome, siege, tier };
}

function estimateTier(state: any): number {
  const hpA = sum((state?.units ?? []).filter((unit: any) => unit.team === 'A').map((unit: any) => unit.maxHp ?? 0));
  const hpB = sum((state?.units ?? []).filter((unit: any) => unit.team === 'B').map((unit: any) => unit.maxHp ?? 0));
  const total = hpA + hpB;
  if (total > 1200) return 3;
  if (total > 700) return 2;
  return 1;
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}
