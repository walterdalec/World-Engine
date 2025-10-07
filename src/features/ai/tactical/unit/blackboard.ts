
import type { BattleState, Unit } from '../../../battle/types';
import type { UnitBlackboard } from './types';

export function buildUnitBB(state: BattleState, unitId: string): UnitBlackboard | null {
  const unit = findUnit(state, unitId);
  if (!unit || !unit.pos) return null;
  return {
    myId: unit.id,
    pos: { q: unit.pos.q, r: unit.pos.r },
    team: unit.faction === 'Enemy' ? 'Enemy' : 'Player',
    hp: unit.stats.hp ?? unit.stats.maxHp ?? 0,
    maxHp: unit.stats.maxHp ?? unit.stats.hp ?? 1,
    morale: unit.morale ?? 50,
    stamina: unit.stamina ?? 100,
    range: unit.range ?? unit.stats.rng ?? 1,
    move: unit.move ?? unit.stats.move ?? 3,
    lastSeenTargets: [],
  };
}

export function refreshUnitBB(bb: UnitBlackboard, state: BattleState) {
  const unit = findUnit(state, bb.myId);
  if (!unit) return;
  if (unit.pos) bb.pos = { q: unit.pos.q, r: unit.pos.r };
  bb.hp = unit.stats.hp ?? bb.hp;
  bb.maxHp = unit.stats.maxHp ?? bb.maxHp;
  bb.morale = unit.morale ?? bb.morale;
  bb.stamina = unit.stamina ?? bb.stamina;
}

function findUnit(state: BattleState, id: string): Unit | undefined {
  return state.units.find((u) => u.id === id);
}
