
import { AIContext, Army, ArmyObjective, Faction, ID } from './types';
import { chooseConquestTarget } from './expansion';
import { neighborsOf } from './world';

export function assignArmyObjectives(ctx: AIContext, faction: Faction) {
  const { world, rand } = ctx;

  for (const armyId of faction.armies) {
    const army = world.armies[armyId];
    if (!army) continue;
    if (army.objective && army.objective.expiresTurn > world.turn) continue;

    const stance = army.stance ?? 'Hold';
    let objective: ArmyObjective | null = null;

    if (stance === 'Raid') {
      const targetRegionId = pickRaidTarget(world, faction.id, army.locationRegionId, rand);
      if (targetRegionId) {
        objective = makeObjective('RaidRoute', targetRegionId, world.turn + 10, 50, rand);
      }
    } else if (stance === 'Consolidate') {
      objective = makeObjective('HoldRegion', army.locationRegionId, world.turn + 8, 25, rand);
    } else {
      const target = chooseConquestTarget(ctx, faction, army.locationRegionId);
      if (target) {
        objective = makeObjective('SeizeRegion', target.id, world.turn + 12, 100, rand);
      }
    }

    if (objective) {
      army.objective = objective;
    }
  }
}

export function scoreObjectiveProgress(world: AIContext['world'], army: Army) {
  if (!army.objective) return 0;
  return army.locationRegionId === army.objective.targetRegionId ? 1 : 0;
}

function pickRaidTarget(world: AIContext['world'], factionId: ID, fromRegionId: ID, rand: () => number) {
  const neighbors = neighborsOf(world, fromRegionId).filter(
    (region) => region.ownerId && region.ownerId !== factionId
  );
  if (!neighbors.length) return null;
  const settlements = neighbors.filter((region) => region.biome === 'Settlement');
  const pool = settlements.length ? settlements : neighbors;
  const index = Math.floor(rand() * pool.length);
  return pool[index]?.id ?? null;
}

function makeObjective(
  kind: ArmyObjective['kind'],
  regionId: ID,
  expiresTurn: number,
  reward: number,
  rand: () => number
): ArmyObjective {
  const id = `obj_${Math.floor(rand() * 1_000_000)}`;
  return {
    id,
    kind,
    targetRegionId: regionId,
    expiresTurn,
    reward,
  };
}
