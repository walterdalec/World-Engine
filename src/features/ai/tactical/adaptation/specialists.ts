
import type { BattleState } from '../../../battle/types';
import type { UnitIntent, UnitBlackboard } from '../unit/types';

export type Archetype = 'Infantry' | 'Shield' | 'Skirmisher' | 'Archer' | 'Cavalry' | 'Mage' | 'Siege';

export function specialistIntent(archetype: Archetype, state: BattleState, bb: UnitBlackboard, base: UnitIntent): UnitIntent {
  switch (archetype) {
    case 'Archer':
      return archerMicro(state, bb, base);
    case 'Cavalry':
      return cavalryMicro(state, bb, base);
    case 'Mage':
      return mageMicro(state, bb, base);
    default:
      return base;
  }
}

function archerMicro(state: BattleState, bb: UnitBlackboard, base: UnitIntent): UnitIntent {
  const adjacentEnemy = state.units.some(
    (unit) => !unit.isDead && unit.pos && factionToTeam(unit.faction) !== bb.team && hexDist(unit.pos, bb.pos) <= 1,
  );
  if (adjacentEnemy && bb.stamina > 20) {
    return {
      ...base,
      kind: 'Reposition',
      targetHex: { q: bb.pos.q - 1, r: bb.pos.r },
      urgency: Math.max(base.urgency, 80),
    };
  }
  return base;
}

function cavalryMicro(state: BattleState, bb: UnitBlackboard, base: UnitIntent): UnitIntent {
  if (bb.morale > 60) {
    return {
      ...base,
      kind: 'Move',
      targetHex: { q: bb.pos.q + 2, r: bb.pos.r - 1 },
      urgency: Math.max(base.urgency, 85),
    };
  }
  return base;
}

function mageMicro(state: BattleState, bb: UnitBlackboard, base: UnitIntent): UnitIntent {
  const packed = state.units.filter((u) => !u.isDead && u.pos && factionToTeam(u.faction) !== bb.team && hexDist(u.pos, bb.pos) <= 2).length >= 3;
  if (packed) {
    return {
      unitId: bb.myId,
      kind: 'Ability',
      abilityId: 'FireBlast',
      targetHex: bb.pos,
      urgency: Math.max(base.urgency, 90),
    };
  }
  return base;
}

function factionToTeam(faction: any): 'Player' | 'Enemy' {
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
