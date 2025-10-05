
import { ID, PlayerOpportunity, WorldState } from './types';

export function snapshot(world: WorldState) {
  return {
    turn: world.turn,
    season: world.season,
    factions: Object.values(world.factions).map((faction) => ({
      id: faction.id,
      name: faction.name,
      treasury: faction.treasury,
      regions: faction.regions.length,
      income: faction.income,
      upkeep: faction.upkeep,
      armies: faction.armies.length,
    })),
  };
}

export function snapshotExtended(world: WorldState) {
  return {
    treaties: world.tradeTreaties?.length ?? 0,
    smugglers: Object.keys(world.smugglers ?? {}).length,
    contrabandRoutes: Object.keys(world.contraband ?? {}).length,
    stances: Object.values(world.armies).reduce<Record<string, number>>((acc, army) => {
      const stance = army.stance ?? 'Unset';
      acc[stance] = (acc[stance] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export function getPlayerOpportunities(world: WorldState, playerFactionId: ID): PlayerOpportunity[] {
  const opportunities: PlayerOpportunity[] = [];

  for (const region of Object.values(world.regions)) {
    if (region.ownerId === playerFactionId && region.unrest > 40 && region.fort > 0) {
      opportunities.push({ kind: 'Relief', regionId: region.id });
    }
  }

  if (world.caravans && world.tradeRoutes) {
    for (const caravan of Object.values(world.caravans)) {
      if (caravan.status !== 'Travel') continue;
      const route = world.tradeRoutes[caravan.routeId];
      if (!route) continue;
      const origin = world.regions[route.from];
      if (!origin) continue;
      opportunities.push({
        kind: 'Escort',
        regionId: origin.id,
        routeId: route.id,
        reward: Math.round(caravan.value * 0.1),
      });
      opportunities.push({
        kind: 'Raid',
        regionId: origin.id,
        routeId: route.id,
        reward: Math.round(caravan.value * 0.2),
      });
    }
  }

  if (world.smugglers && world.contraband) {
    for (const smuggler of Object.values(world.smugglers)) {
      if (smuggler.status !== 'Travel') continue;
      const route = world.contraband[smuggler.routeId];
      if (!route) continue;
      opportunities.push({
        kind: 'Intercept',
        regionId: route.from,
        routeId: route.id,
        reward: Math.round(smuggler.value * 0.25),
      });
      opportunities.push({
        kind: 'Smuggle',
        regionId: route.to,
        routeId: route.id,
        reward: Math.round(smuggler.value * 0.2),
      });
    }
  }

  return opportunities;
}
