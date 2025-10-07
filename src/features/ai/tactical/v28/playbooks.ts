
export interface Playbook {
  id: string;
  name: string;
  orderWeights: Partial<Record<'FocusFire' | 'AdvanceLine' | 'Hold' | 'Flank' | 'Fallback' | 'Rally', number>>;
  formationPref: Array<{ kind: 'Line' | 'Wedge' | 'Column'; weight: number }>;
  maneuverPref: Array<{ key: 'Rotate' | 'RefuseFlank' | 'StagedAdvance' | 'CollapseToAnchor'; weight: number }>;
  thresholds?: Partial<{ fallback: number; rally: number; advance: number; rotate: number }>;
  scenarioBias?: Partial<Record<'Siege' | 'Ambush' | 'Bridge', number>>;
}

export const PLAYBOOKS: Record<string, Playbook> = {
  knightly_order: {
    id: 'knightly_order',
    name: 'Knightly Order',
    orderWeights: { Hold: 8, AdvanceLine: 5, FocusFire: 2 },
    formationPref: [
      { kind: 'Line', weight: 3 },
      { kind: 'Wedge', weight: 1 },
    ],
    maneuverPref: [
      { key: 'Rotate', weight: 2 },
      { key: 'RefuseFlank', weight: 3 },
    ],
    thresholds: { fallback: 14, rally: 7, advance: 4, rotate: 4 },
    scenarioBias: { Bridge: 4 },
  },
  desert_raiders: {
    id: 'desert_raiders',
    name: 'Desert Raiders',
    orderWeights: { Flank: 8, FocusFire: 5, Hold: -2 },
    formationPref: [
      { kind: 'Wedge', weight: 3 },
      { kind: 'Column', weight: 1 },
    ],
    maneuverPref: [
      { key: 'StagedAdvance', weight: 2 },
      { key: 'RefuseFlank', weight: 1 },
    ],
    thresholds: { fallback: 10, advance: 2 },
    scenarioBias: { Ambush: 6 },
  },
  siege_engineers: {
    id: 'siege_engineers',
    name: 'Siege Engineers',
    orderWeights: { Hold: 6, FocusFire: 4 },
    formationPref: [
      { kind: 'Line', weight: 2 },
      { kind: 'Column', weight: 2 },
    ],
    maneuverPref: [
      { key: 'CollapseToAnchor', weight: 3 },
    ],
    thresholds: { rotate: 6 },
    scenarioBias: { Siege: 8 },
  },
};

export function pickFormationFromPlaybook(playbook: Playbook, rng: () => number) {
  const total = playbook.formationPref.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return playbook.formationPref[0]?.kind ?? 'Line';
  let roll = rng() * total;
  for (const entry of playbook.formationPref) {
    roll -= entry.weight;
    if (roll <= 0) return entry.kind;
  }
  return playbook.formationPref[0]?.kind ?? 'Line';
}
