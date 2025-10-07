
import type { BattleState, Unit } from '../../../battle/types';
import type { UnitBlackboard, UnitIntent } from '../unit/types';

export interface ThreatSnapshot {
  ranged: number;
  aoe: boolean;
  flank: boolean;
}

export function detectThreats(state: BattleState, bb: UnitBlackboard): ThreatSnapshot {
  const threats: ThreatSnapshot = { ranged: 0, aoe: false, flank: false };
  for (const unit of state.units) {
    if (!unit.pos || unit.isDead || unit.id === bb.myId) continue;
    if (factionToTeam(unit.faction) === bb.team) continue;
    const distance = hexDist(unit.pos, bb.pos);
    if ((unit.range ?? unit.stats.rng ?? 1) > 1 && distance <= (unit.range ?? unit.stats.rng ?? 1) + 1) {
      threats.ranged += 1;
    }
  }
  const recentEvents = Array.isArray((state as any).events) ? (state as any).events.slice(-10) : [];
  threats.aoe = recentEvents.some((evt: any) => evt?.kind === 'AoeTelegraph' && evt.hex && hexDist(evt.hex, bb.pos) <= 1);
  threats.flank = isFlanked(state, bb);
  return threats;
}

export function counterplayAdjust(state: BattleState, bb: UnitBlackboard, base: UnitIntent): UnitIntent {
  const threats = detectThreats(state, bb);
  if (threats.aoe) {
    return {
      ...base,
      kind: 'Reposition',
      targetHex: stepAway(bb.pos),
      urgency: Math.max(base.urgency, 85),
    };
  }
  if (!threats.aoe && threats.ranged > 0 && (bb.range ?? 1) <= 1) {
    const archer = nearestRanged(state, bb);
    if (archer?.pos) {
      return {
        unitId: bb.myId,
        kind: 'Move',
        targetHex: stepToward(bb.pos, archer.pos),
        urgency: Math.max(base.urgency, 70),
      };
    }
  }
  if (threats.flank && base.kind === 'Move') {
    return { ...base, kind: 'Hold', urgency: Math.max(base.urgency, 60) };
  }
  return base;
}

function nearestRanged(state: BattleState, bb: UnitBlackboard): Unit | undefined {
  return state.units
    .filter((u) => !u.isDead && u.pos && factionToTeam(u.faction) !== bb.team && (u.range ?? u.stats.rng ?? 1) > 1)
    .sort((a, b) => hexDist(a.pos!, bb.pos) - hexDist(b.pos!, bb.pos))[0];
}

function stepAway(pos: { q: number; r: number }) {
  return { q: pos.q - 1, r: pos.r };
}

function stepToward(from: { q: number; r: number }, to: { q: number; r: number }) {
  const dq = Math.sign(to.q - from.q);
  const dr = Math.sign(to.r - from.r);
  return { q: from.q + dq, r: from.r + dr };
}

function isFlanked(state: BattleState, bb: UnitBlackboard) {
  const allies = state.units.filter((u) => !u.isDead && factionToTeam(u.faction) === bb.team && u.pos);
  const enemies = state.units.filter((u) => !u.isDead && factionToTeam(u.faction) !== bb.team && u.pos);
  const allySupport = allies.filter((ally) => ally.id !== bb.myId && ally.pos && hexDist(ally.pos, bb.pos) <= 1).length;
  const enemyPressure = enemies.filter((enemy) => hexDist(enemy.pos!, bb.pos) <= 1).length;
  return enemyPressure > allySupport + 1;
}

function factionToTeam(faction: Unit['faction']): 'Player' | 'Enemy' {
  return faction === 'Enemy' ? 'Enemy' : 'Player';
}

function hexDist(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const ax = a.q;
  const ay = a.r;
  const az = -a.q - a.r;
  const bx = b.q;
  const by = b.r;
  const bz = -b.q - b.r;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}
