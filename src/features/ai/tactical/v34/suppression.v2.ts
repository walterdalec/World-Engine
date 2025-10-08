export interface ShooterState {
  id: string;
  ammo: number;
  heat: number;
  target?: string;
}

export function assignPriorityTargets(shooters: ShooterState[], threats: any[]): ShooterState[] {
  const sortedThreats = [...(threats ?? [])].sort((a, b) => threatScore(b) - threatScore(a));
  return shooters.map((shooter, idx) => {
    const target = sortedThreats[idx % (sortedThreats.length || 1)];
    shooter.target = target?.id;
    return shooter;
  });
}

export function manageHeat(shooters: ShooterState[]): void {
  for (const shooter of shooters) {
    shooter.heat = Math.max(0, shooter.heat - 0.1);
    if (shooter.heat >= 1) {
      shooter.ammo = Math.max(0, shooter.ammo - 1);
    }
  }
}

function threatScore(threat: any): number {
  if (!threat) return 0;
  let score = 1;
  const role = (threat.role ?? '').toLowerCase();
  if (role.includes('archer') || role.includes('caster')) score *= 1.2;
  if (threat.hp && threat.maxHp && threat.hp / threat.maxHp < 0.5) score *= 1.5;
  if (threat.isElite) score *= 1.3;
  return score;
}
