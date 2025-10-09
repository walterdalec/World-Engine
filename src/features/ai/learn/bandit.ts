export interface ArmScore { name: string; base: number }
export interface BanditCfg { tau: number; explore: number }

export function softmaxPick(arms: ArmScore[], seed: number, cfg: BanditCfg): string {
  if (!arms.length) return '';
  const max = Math.max(...arms.map(arm => arm.base));
  const denom = cfg.tau || 1;
  const exps = arms.map(arm => Math.exp((arm.base - max) / denom));
  const sum = exps.reduce((acc, value) => acc + value, 0) || 1;
  const rng = seeded(seed);
  const roll = rng();
  let acc = 0;
  for (let i = 0; i < arms.length; i += 1) {
    acc += exps[i] / sum;
    if (roll <= acc) return arms[i].name;
  }
  return arms[0].name;
}

export function seeded(seed: number) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let x = state;
    x = Math.imul(x ^ (x >>> 15), 1 | x);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
