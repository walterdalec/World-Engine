import {
  AIContext,
  Army,
  Faction,
  ID,
  WorldState,
} from './types';
import { neighborsOf, distanceRegions, shortestPathRegions } from './world';
import { rngBool, rngPick, rngInt } from './rng';
import { chooseConquestTarget } from './expansion';
import { applyCaptureWarScore, applyWarScore } from './diplomacy';
import { getDifficulty } from './difficulty';
import { applyStanceEffects } from './military.stance';
import { recordBattle } from '../../ai/tactical/v29';

export function recomputeArmyStrength(army: Army) {
  if (!army.units || !army.units.length) return;
  let strength = 0;
  let upkeep = 0;
  for (const unit of army.units) {
    const roleMultiplier =
      unit.kind === 'Cavalry'
        ? 1.2
        : unit.kind === 'Mage'
          ? 1.4
          : unit.kind === 'Siege'
            ? 1.6
            : unit.kind === 'Archer'
              ? 1.1
              : 1;
    strength += (10 + unit.gearScore * 0.6 + unit.level * 8) * roleMultiplier;
    upkeep += unit.upkeep;
  }
  army.strength = Math.max(1, Math.round(strength));
  army.upkeep = Math.round(upkeep);
}

export function maintainArmies(ctx: AIContext) {
  const { world, rand } = ctx;
  for (const army of Object.values(world.armies)) {
    applyStanceEffects(army);

    if (army.units?.length) recomputeArmyStrength(army);

    const faction = world.factions[army.factionId];
    const inSiege = army.status === 'Siege';

    const baseDrain = inSiege ? 8 : 2;
    army.supplies = Math.max(0, Math.min(100, army.supplies - baseDrain));
    if (army.supplies < 20) {
      army.morale = Math.max(0, army.morale - 5);
    }

    if (faction.treasury < 0) {
      army.morale = Math.max(0, army.morale - 3);
    }

    const region = world.regions[army.locationRegionId];
    if (army.status === 'Idle' && region?.ownerId === faction.id) {
      army.morale = Math.min(100, army.morale + 2);
      army.supplies = Math.min(100, army.supplies + 5);
    }

    if (army.morale <= 5 && rngBool(rand, 0.15)) {
      army.strength = Math.max(1, Math.floor(army.strength * 0.85));
      army.morale = Math.min(60, army.morale + 10);
    }
  }
}

export function planArmyOrders(ctx: AIContext, faction: Faction) {
  const { world, rand } = ctx;
  const armies = faction.armies
    .map((id) => world.armies[id])
    .filter((army): army is Army => Boolean(army));
  if (!armies.length) return;

  const offensiveArmies = armies.filter((army) => army.stance !== 'Consolidate');
  const main = offensiveArmies.length ? rngPick(rand, offensiveArmies) : null;
  if (main) {
    const target = chooseConquestTarget(ctx, faction, main.locationRegionId);
    if (target) {
      main.targetRegionId = target.id;
      main.status = 'Marching';
      main.moveCooldown = 0;
    }
  }

  for (const army of armies) {
    if (army === main) continue;
    if (army.stance === 'Consolidate') continue;

    const borderRegions = faction.regions.filter((regionId) =>
      neighborsOf(world, regionId).some((neighbor) => neighbor.ownerId !== faction.id)
    );
    if (!borderRegions.length) continue;
    army.targetRegionId = rngPick(rand, borderRegions);
    army.status = 'Marching';
    if (army.stance === 'Hold') {
      army.moveCooldown = Math.max(army.moveCooldown ?? 0, 1);
    } else {
      army.moveCooldown = 0;
    }
  }
}

export function advanceMarch(ctx: AIContext) {
  const { world } = ctx;
  for (const army of Object.values(world.armies)) {
    if (army.status !== 'Marching' || !army.targetRegionId) continue;
    if (army.stance === 'Consolidate') continue;

    if (army.stance === 'Hold' && (army.moveCooldown ?? 0) > 0) {
      army.moveCooldown = Math.max(0, (army.moveCooldown ?? 0) - 1);
      continue;
    }

    ensurePath(world, army, army.targetRegionId);
    const speed = Math.max(0, Math.floor(army.marchSpeed ?? 1));
    if (speed <= 0) continue;

    let moved = false;
    for (let step = 0; step < speed; step += 1) {
      if (!army.path || army.path.length <= 1) break;
      army.path.shift();
      if (!army.path.length) break;
      army.locationRegionId = army.path[0]!;
      moved = true;
    }

    if (army.path && army.path.length <= 1) {
      army.status = 'Idle';
    }

    if (army.stance === 'Hold') {
      army.moveCooldown = moved ? 1 : army.moveCooldown ?? 0;
    } else {
      army.moveCooldown = 0;
    }
  }
}

export function resolveArrivalsAndConflicts(ctx: AIContext) {
  const { world, rand } = ctx;
  for (const army of Object.values(world.armies)) {
    if (!army.targetRegionId) continue;
    if (army.locationRegionId !== army.targetRegionId) continue;

    const region = world.regions[army.targetRegionId];
    if (!region) continue;
    const defenderId = region.ownerId;

    if (!defenderId || defenderId === army.factionId) {
      army.status = 'Idle';
      army.targetRegionId = undefined;
      army.path = undefined;
      army.moveCooldown = 0;
      continue;
    }

    const garrisonStrength = region.garrison?.strength ?? 0;
    const relief = computeReliefForces(world, defenderId, region.id);
    const defenderStrength = garrisonStrength + relief.totalStrength;

    const outcome = autoResolve(army.strength, defenderStrength, rand);
    const winnerFactionId = outcome.winner === 'A' ? army.factionId : defenderId;
    const loserFactionId = outcome.winner === 'A' ? defenderId : army.factionId;

    recordBattle(world, {
      winnerFactionId,
      loserFactionId,
      routs: outcome.delta > 20 ? [loserFactionId] : [],
      objectivesHeldByFaction: {
        [army.factionId]: outcome.winner === 'A' ? 1 : 0,
        [defenderId]: outcome.winner === 'B' ? 1 : 0,
      },
    });

    world.events.push({
      id: `evt_${world.events.length}`,
      t: world.turn,
      kind: 'Battle',
      regionId: region.id,
      a: army.id,
      b: region.garrison?.id ?? 'GAR',
      result: outcome.winner,
      delta: outcome.delta,
    });

    applyWarScore(world, army.factionId, defenderId, outcome);

    if (outcome.winner === 'A') {
      if (region.fort > 0) {
        army.status = 'Siege';
        world.events.push({
          id: `evt_${world.events.length}`,
          t: world.turn,
          kind: 'SiegeStarted',
          regionId: region.id,
          attacker: army.id,
        });
      } else {
        captureRegion(world, region.id, army.factionId);
        army.status = 'Recovering';
      }
    } else {
      army.morale = Math.max(0, army.morale - 15);
      army.supplies = Math.max(0, army.supplies - 15);
      army.status = 'Recovering';
    }

    army.targetRegionId = undefined;
    army.path = undefined;
    army.moveCooldown = 0;
  }
}

export function tickSieges(ctx: AIContext) {
  const { world, rand } = ctx;
  for (const army of Object.values(world.armies)) {
    if (army.status !== 'Siege') continue;
    const region = world.regions[army.locationRegionId];
    if (!region) continue;

    const attackFactor = (army.supplies / 100) * (army.morale / 100);
    const defendFactor = 0.3 + region.fort * 0.2;

    if (attackFactor + rand() * 0.2 > defendFactor) {
      world.events.push({
        id: `evt_${world.events.length}`,
        t: world.turn,
        kind: 'SiegeResolved',
        regionId: region.id,
        winner: army.id,
      });
      captureRegion(world, region.id, army.factionId);
      army.status = 'Recovering';
      army.supplies = Math.max(0, army.supplies - 20);
    } else {
      army.supplies = Math.max(0, army.supplies - 10);
      army.morale = Math.max(0, army.morale - 2);
    }
  }
}

export function evaluateSupply(ctx: AIContext) {
  const { world } = ctx;
  const difficulty = getDifficulty(world);
  for (const army of Object.values(world.armies)) {
    const region = world.regions[army.locationRegionId];
    if (!region) continue;
    const friendly = region.ownerId === army.factionId;
    const chain = friendly && hasSupplyChain(world, army);

    if (chain) {
      army.supplies = Math.min(100, army.supplies + 6);
    } else if (friendly) {
      army.supplies = Math.max(0, army.supplies - 2 + difficulty.aiAttritionMitigation);
    } else {
      army.supplies = Math.max(0, army.supplies - 8 + difficulty.aiAttritionMitigation);
      if (army.supplies < 20) {
        army.strength = Math.max(1, Math.round(army.strength * 0.98));
        army.morale = Math.max(0, army.morale - 2);
      }
    }
  }
}

export function hasSupplyChain(world: WorldState, army: Army) {
  const hub = army.supplyHubId ?? pickDefaultHub(world, army.factionId);
  if (!hub) return false;
  const path = shortestPathRegions(world, army.locationRegionId, hub, (regionId) => {
    const owner = world.regions[regionId]?.ownerId;
    return owner === army.factionId;
  });
  return path.length > 0;
}

function pickDefaultHub(world: WorldState, factionId: ID): ID | null {
  let best: { id: ID; wealth: number } | null = null;
  for (const region of Object.values(world.regions)) {
    if (region.ownerId !== factionId) continue;
    if (!best || region.wealth > best.wealth) {
      best = { id: region.id, wealth: region.wealth };
    }
  }
  return best?.id ?? null;
}

function computeReliefForces(world: WorldState, defenderId: ID, regionId: ID) {
  let totalStrength = 0;
  const targetRegion = world.regions[regionId];
  if (!targetRegion) return { totalStrength, armies: [] as ID[] };

  const reliefArmies: ID[] = [];

  for (const army of Object.values(world.armies)) {
    if (army.factionId !== defenderId) continue;
    const location = world.regions[army.locationRegionId];
    if (!location) continue;
    const distance = distanceRegions(location, targetRegion);
    if (distance === 0) continue;

    if (distance <= 1) {
      totalStrength += Math.round(army.strength * 0.6);
      reliefArmies.push(army.id);
    } else if (distance === 2) {
      totalStrength += Math.round(army.strength * 0.3);
      reliefArmies.push(army.id);
    }
  }

  return { totalStrength, armies: reliefArmies };
}

export function checkCaravanAmbushes(ctx: AIContext) {
  const { world, rand } = ctx;
  if (!world.caravans || !world.tradeRoutes) return;

  for (const caravan of Object.values(world.caravans)) {
    if (caravan.status !== 'Travel') continue;
    const route = world.tradeRoutes[caravan.routeId];
    if (!route) continue;
    const origin = world.regions[route.from];
    if (!origin) continue;
    const risk = route.danger + origin.unrest + rngInt(rand, -10, 10);

    if (risk <= 100) continue;
    caravan.status = 'Ambush';
    const caravanWins = rand() < 0.5;

    if (caravanWins) {
      caravan.guards = Math.max(10, caravan.guards - rngInt(rand, 5, 15));
      caravan.status = 'Travel';
    } else {
      caravan.status = 'Destroyed';
      world.events.push({
        id: `evt_${world.events.length}`,
        t: world.turn,
        kind: 'Revolt',
        regionId: origin.id,
      });
    }
  }
}

function ensurePath(world: WorldState, army: Army, target: ID) {
  if (army.path && army.path.length > 0 && army.path[army.path.length - 1] === target) {
    return;
  }
  const path = shortestPathRegions(world, army.locationRegionId, target);
  if (path.length) {
    army.path = path;
  } else {
    army.path = [army.locationRegionId, target];
  }
}

function autoResolve(attacker: number, defender: number, rand: () => number) {
  const a = Math.max(1, attacker);
  const d = Math.max(1, defender);
  const balance = a / (a + d);
  const roll = rand();
  const swing = (roll - 0.5) * 0.2;
  const chanceA = Math.min(0.95, Math.max(0.05, balance + swing));
  const winner = roll < chanceA ? 'A' : 'B';
  const delta = Math.round((balance - 0.5) * 100);
  return { winner, delta } as const;
}

export function captureRegion(world: WorldState, regionId: ID, newOwnerId: ID) {
  const region = world.regions[regionId];
  if (!region) return;
  const previousOwnerId = region.ownerId;
  if (previousOwnerId && world.factions[previousOwnerId]) {
    const prevFaction = world.factions[previousOwnerId];
    prevFaction.regions = prevFaction.regions.filter((rid) => rid !== regionId);
  }
  region.ownerId = newOwnerId;
  region.unrest = Math.min(100, region.unrest + 35);
  const newOwner = world.factions[newOwnerId];
  if (newOwner && !newOwner.regions.includes(regionId)) {
    newOwner.regions.push(regionId);
  }
  if (previousOwnerId && previousOwnerId !== newOwnerId) {
    applyCaptureWarScore(world, newOwnerId, previousOwnerId, regionId);
  }
}
