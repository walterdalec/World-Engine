export interface DangerMap {
  heat: Record<string, number>;
  decay: number;
}

export function createDangerMap(): DangerMap {
  return { heat: {}, decay: 0.85 };
}

export function addDanger(map: DangerMap, hex: { q: number; r: number }, amount: number) {
  const key = `${hex.q},${hex.r}`;
  map.heat[key] = (map.heat[key] ?? 0) + amount;
}

export function decayDanger(map: DangerMap) {
  for (const key of Object.keys(map.heat)) {
    map.heat[key] *= map.decay;
    if (map.heat[key] < 0.05) delete map.heat[key];
  }
}

export function dangerAt(map: DangerMap, hex: { q: number; r: number }) {
  return map.heat[`${hex.q},${hex.r}`] ?? 0;
}
