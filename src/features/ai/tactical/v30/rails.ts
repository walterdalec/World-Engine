export type Difficulty = 'Story' | 'Normal' | 'Hard' | 'Brutal';

export interface Rails {
  dmgMult: number;
  hpMult: number;
  aiAgg: number;
  reinforceTurns: number[];
}

export const DIFF: Record<Difficulty, Rails> = {
  Story: { dmgMult: 0.9, hpMult: 1.2, aiAgg: 0.8, reinforceTurns: [6, 12] },
  Normal: { dmgMult: 1.0, hpMult: 1.0, aiAgg: 1.0, reinforceTurns: [7, 14] },
  Hard: { dmgMult: 1.1, hpMult: 1.0, aiAgg: 1.1, reinforceTurns: [6, 12] },
  Brutal: { dmgMult: 1.2, hpMult: 0.9, aiAgg: 1.2, reinforceTurns: [5, 10] },
};

export function applyRails(state: any, rails: Rails): void {
  state.modifiers = state.modifiers ?? [];
  state.modifiers.push({ type: 'DamageScale', value: rails.dmgMult });
  state.modifiers.push({ type: 'HpScale', value: rails.hpMult });
  state.aiAggression = rails.aiAgg;
  state.reinforcements = rails.reinforceTurns.slice();
}
