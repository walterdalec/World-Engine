export interface UnitSummary {
  atk: number;
  def: number;
  hp: number;
  range: number;
  role?: string;
}

export interface ArmySummary {
  units: UnitSummary[];
}

export interface AutoConfig {
  seed: number;
  kAtk: number;
  kDef: number;
  kRange: number;
  kFocus: number;
  rounds: number;
}

export interface AutoResult {
  result: 'A' | 'B' | 'Draw';
  A: { hp: number; atk: number; def: number; rng: number };
  B: { hp: number; atk: number; def: number; rng: number };
}

export function simulate(AA: ArmySummary, BB: ArmySummary, cfg: AutoConfig): AutoResult {
  const rng = seedRng(cfg.seed);
  const A = {
    hp: sumHp(AA),
    atk: sumAtk(AA),
    def: sumDef(AA),
    rng: sumRange(AA),
  };
  const B = {
    hp: sumHp(BB),
    atk: sumAtk(BB),
    def: sumDef(BB),
    rng: sumRange(BB),
  };

  for (let round = 0; round < cfg.rounds && A.hp > 0 && B.hp > 0; round += 1) {
    const aDmg =
      Math.max(0, A.atk * cfg.kAtk - B.def * cfg.kDef) * (1 + cfg.kRange * A.rng) * (0.9 + 0.2 * rng());
    const bDmg =
      Math.max(0, B.atk * cfg.kAtk - A.def * cfg.kDef) * (1 + cfg.kRange * B.rng) * (0.9 + 0.2 * rng());
    B.hp -= aDmg;
    A.hp -= bDmg;
  }

  const result = A.hp === B.hp ? 'Draw' : A.hp > B.hp ? 'A' : 'B';
  return { result, A, B };
}

export function calibrateFromBattle(_tactical: any): AutoConfig {
  return { kAtk: 1.0, kDef: 1.0, kRange: 0.1, kFocus: 0.05, rounds: 8, seed: Date.now() & 0xffffffff };
}

function seedRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    t ^= t >>> 14;
    return (t >>> 0) / 4294967296;
  };
}

function sumHp(army: ArmySummary): number {
  return army.units.reduce((sum, unit) => sum + unit.hp, 0);
}

function sumAtk(army: ArmySummary): number {
  return army.units.reduce((sum, unit) => sum + unit.atk, 0);
}

function sumDef(army: ArmySummary): number {
  return army.units.reduce((sum, unit) => sum + unit.def, 0);
}

function sumRange(army: ArmySummary): number {
  return army.units.reduce((sum, unit) => sum + Math.max(0, unit.range - 1), 0);
}
