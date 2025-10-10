/** Revival pricing based on level + gear score */
export function reviveCost(level: number, gearScore=0){
  const base = 50;
  const levelMult = 1 + (level * 0.35);
  const gearMult = 1 + (gearScore * 0.02);
  return Math.round(base * levelMult * gearMult);
}
