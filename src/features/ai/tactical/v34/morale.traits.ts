export interface MoraleTrait {
  id: string;
  kind: 'Fear' | 'Discipline' | 'Inspiration';
  value: number;
  duration?: number;
}

export interface MoraleScar {
  source: string;
  impact: number;
  decay: number;
}

export function applyMoraleTraits(base: number, traits: MoraleTrait[], scars: MoraleScar[]): number {
  let val = base;
  for (const trait of traits) {
    const effect = trait.value * (trait.kind === 'Fear' ? -1 : 1);
    val += effect;
  }
  for (const scar of scars) {
    val += scar.impact * 50 * Math.exp(-scar.decay / 10);
  }
  return clamp(val, 0, 100);
}

export function tickScars(scars: MoraleScar[]): MoraleScar[] {
  return scars
    .map(scar => ({ ...scar, decay: Math.max(0, scar.decay - 1) }))
    .filter(scar => scar.decay > 0);
}

export function createTrait(kind: 'Fear' | 'Discipline' | 'Inspiration', value: number): MoraleTrait {
  return {
    id: `trait_${kind}_${Math.random().toString(36).slice(2, 6)}`,
    kind,
    value,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
