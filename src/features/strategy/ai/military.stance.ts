
import { AIContext, Army, ArmyStance, Faction, ID } from './types';
import { rngBool } from './rng';

export function chooseSeasonalStances(ctx: AIContext, faction: Faction) {
  const { world } = ctx;
  const borderExposure = totalBorderExposure(world.regions, world.factions[faction.id]?.regions ?? []);
  const atWar = Object.keys(faction.wars).length > 0;

  for (const armyId of faction.armies) {
    const army = world.armies[armyId];
    if (!army) continue;
    if (army.stanceUntilTurn && army.stanceUntilTurn > world.turn) continue;

    let stance: ArmyStance = army.stance ?? 'Hold';

    if (atWar && army.supplies > 40 && army.morale > 40) {
      stance = 'Raid';
    } else if (!atWar && (army.supplies < 30 || army.morale < 30)) {
      stance = 'Consolidate';
    } else {
      stance = 'Hold';
    }

    if (borderExposure > 6 && !atWar) {
      stance = 'Hold';
    }

    if (faction.ai.aggression > 70 && rngBool(ctx.rand, 0.2)) {
      stance = 'Raid';
    }

    if (faction.ai.caution > 70 && rngBool(ctx.rand, 0.2)) {
      stance = 'Hold';
    }

    setStance(world, army, stance, world.turn + 8);
  }
}

function totalBorderExposure(regions: Record<ID, any>, regionIds: string[]) {
  let exposure = 0;
  for (const regionId of regionIds) {
    const region = regions[regionId];
    if (!region) continue;
    for (const neighborId of region.neighbors) {
      const neighbor = regions[neighborId];
      if (!neighbor) continue;
      if (neighbor.ownerId && neighbor.ownerId !== region.ownerId) exposure += 1;
    }
  }
  return exposure;
}

export function setStance(_world: any, army: Army, stance: ArmyStance, untilTurn: number) {
  army.stance = stance;
  army.stanceUntilTurn = untilTurn;
}

export function applyStanceEffects(army: Army) {
  const stance = army.stance ?? 'Hold';
  switch (stance) {
    case 'Raid':
      army.marchSpeed = Math.max(1, Math.floor(army.marchSpeed ?? 1));
      army.moveCooldown = 0;
      army.supplies = Math.max(0, army.supplies - 3);
      break;
    case 'Hold':
      army.marchSpeed = Math.max(1, Math.floor(army.marchSpeed ?? 1));
      army.morale = Math.min(100, army.morale + 1);
      break;
    case 'Consolidate':
      army.marchSpeed = 0;
      army.supplies = Math.min(100, army.supplies + 6);
      army.morale = Math.min(100, army.morale + 2);
      army.moveCooldown = Math.max(army.moveCooldown ?? 0, 2);
      break;
    default:
      break;
  }
}
