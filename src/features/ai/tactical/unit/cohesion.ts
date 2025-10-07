
import type { BattleState, Unit } from '../../../battle/types';
import type { UnitBlackboard } from './types';

export function enforceCohesion(state: BattleState, bb: UnitBlackboard, intended: { q: number; r: number }) {
  const allies = getAllies(state, bb);
  const crowded = allies.filter((ally) => ally.pos && hexDist(ally.pos, intended) <= 1).length;
  if (crowded > 3) {
    return bb.pos;
  }
  return intended;
}

function getAllies(state: BattleState, bb: UnitBlackboard): Unit[] {
  return state.units.filter((u) => !u.isDead && u.id !== bb.myId && factionToTeam(u.faction) === bb.team);
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
