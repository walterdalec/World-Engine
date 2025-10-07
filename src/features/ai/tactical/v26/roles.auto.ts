
export type Archetype = 'Shield' | 'Infantry' | 'Skirmisher' | 'Archer' | 'Cavalry' | 'Mage' | 'Siege';

export interface UnitStat {
  atk: number;
  def: number;
  spd: number;
  rng: number;
  hp: number;
  weight?: number;
  traits?: string[];
}

export function classify(stat: UnitStat): Archetype {
  const traits = stat.traits ?? [];
  if (traits.includes('TowerShield') || (stat.def >= stat.atk && stat.def >= 12)) return 'Shield';
  if (stat.rng >= 3) return 'Archer';
  if (traits.includes('Spellcaster')) return 'Mage';
  if (traits.includes('Mounted') && stat.spd >= 6) return 'Cavalry';
  if (stat.spd >= 6 && stat.atk > stat.def) return 'Skirmisher';
  if ((stat.weight ?? 0) >= 9) return 'Siege';
  return 'Infantry';
}

export function batchClassify(units: Record<string, UnitStat>): Record<string, Archetype> {
  const out: Record<string, Archetype> = {};
  for (const [id, stat] of Object.entries(units)) {
    out[id] = classify(stat);
  }
  return out;
}
