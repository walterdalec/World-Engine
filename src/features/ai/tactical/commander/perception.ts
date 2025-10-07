
import type { BattleState, Unit } from '../../../battle/types';
import type { Blackboard, Cluster } from './types';

export function perceive(state: BattleState, bb: Blackboard) {
  bb.enemyClusters = clusterize(state.units.filter(isEnemyUnit));
  bb.allyClusters = clusterize(state.units.filter(isAllyUnit));
  bb.contestedHexes = computeContested(state);
  bb.objectives = computeObjectives(state, bb);
}

function isEnemyUnit(unit: Unit) {
  return unit.faction === 'Enemy' && !unit.isDead;
}

function isAllyUnit(unit: Unit) {
  return unit.faction === 'Player' && !unit.isDead;
}

function clusterize(units: Unit[]): Cluster[] {
  return units.map((unit) => {
    const pos = unit.pos ?? { q: 0, r: 0 };
    const strength = (unit.stats.atk ?? 0) + (unit.stats.def ?? 0) + (unit.stats.hp ?? 0);
    const hpAvg = (unit.stats.hp ?? unit.stats.maxHp ?? 0);
    return {
      id: unit.id,
      units: [unit.id],
      center: { q: pos.q, r: pos.r },
      strength,
      hpAvg,
    };
  });
}

function computeContested(state: BattleState) {
  const contested: { q: number; r: number }[] = [];
  for (const unit of state.units) {
    if (!unit.pos || unit.isDead) continue;
    const enemyNearby = state.units.some((other) => {
      if (other === unit || other.isDead || other.faction === unit.faction) return false;
      if (!other.pos || !unit.pos) return false;
      return hexDistance(unit.pos, other.pos) <= 1;
    });
    if (enemyNearby) contested.push({ q: unit.pos.q, r: unit.pos.r });
  }
  return contested;
}

function computeObjectives(state: BattleState, bb: Blackboard) {
  const objectives: Blackboard['objectives'] = [];
  if (bb.commander.focusRegionId) {
    // Placeholder: If focus region maps to deployment hex, select center of grid
    const center = {
      q: Math.floor(state.grid.width / 2),
      r: Math.floor(state.grid.height / 2),
    };
    objectives.push({ hex: center, score: 75 });
  }
  return objectives;
}

function hexDistance(a: { q: number; r: number }, b: { q: number; r: number }) {
  const aq = a.q;
  const ar = a.r;
  const bq = b.q;
  const br = b.r;
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs((-aq - ar) - (-bq - br)));
}
