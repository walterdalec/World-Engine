import { seedRng, rngInt, rngPick } from './rng';
import {
  Caravan,
  Faction,
  TradeRoute,
  WorldEvent,
  WorldState,
} from './types';
import { shortestPathRegions } from './world';

export function recomputeEconomy(world: WorldState) {
  for (const faction of Object.values(world.factions)) {
    let income = 0;
    for (const regionId of faction.regions) {
      const region = world.regions[regionId];
      if (!region) continue;
      const unrestPenalty = 1 - Math.min(region.unrest, 80) / 100;
      const fortTax = 1 + region.fort * 0.05;
      income += region.wealth * 5 * unrestPenalty * fortTax;
    }

    let upkeep = 0;
    for (const armyId of faction.armies) {
      const army = world.armies[armyId];
      if (!army) continue;
      upkeep += army.upkeep;
    }

    faction.income = Math.floor(income);
    faction.upkeep = Math.floor(upkeep);
  }
}

export function generateTradeRoutes(
  world: WorldState,
  maxRoutes = 20,
  rand: () => number = Math.random
) {
  const settlements = Object.values(world.regions).filter(
    (region) => region.biome === 'Settlement'
  );
  const routes: Record<string, TradeRoute> = {};
  let idCounter = 0;

  if (!settlements.length) {
    world.tradeRoutes = routes;
    return;
  }

  for (let i = 0; i < maxRoutes && settlements.length > 1; i++) {
    const origin = rngPick(rand, settlements);
    const targetCandidates = settlements.filter((region) => region.id !== origin.id);
    if (!targetCandidates.length) continue;
    const destination = rngPick(rand, targetCandidates);

    const wealthFlow = Math.round(
      (origin.wealth + destination.wealth) / 2 + rngInt(rand, -10, 10)
    );
    const danger = Math.round((origin.unrest + destination.unrest) / 2);
    const id = `route_${idCounter++}`;
    const finalWealth = Math.max(5, wealthFlow);
    routes[id] = {
      id,
      from: origin.id,
      to: destination.id,
      wealthFlow: finalWealth,
      danger: Math.max(0, Math.min(100, danger)),
      baseWealthFlow: finalWealth,
    };
  }

  world.tradeRoutes = routes;
}

export function spawnCaravans(world: WorldState, seasonSeed: number) {
  if (!world.tradeRoutes) return;
  if (!world.caravans) world.caravans = {};
  const rand = seedRng(seasonSeed);

  for (const route of Object.values(world.tradeRoutes)) {
    if (rand() >= 0.4) continue;

    const caravanId = `car_${Object.keys(world.caravans).length}`;
    const owner = world.regions[route.from]?.ownerId ?? 'Neutral';

    const caravan: Caravan = {
      id: caravanId,
      routeId: route.id,
      ownerFactionId: owner,
      value: Math.max(1, Math.round(route.wealthFlow * (0.5 + rand()))),
      guards: rngInt(rand, 20, 60),
      locationIndex: 0,
      direction: 1,
      status: 'Travel',
    };

    world.caravans[caravanId] = caravan;
    route.activeCaravanId = caravanId;
  }
}

export function moveCaravans(world: WorldState) {
  const { caravans, tradeRoutes } = world;
  if (!caravans || !tradeRoutes) return;

  for (const caravan of Object.values(caravans)) {
    const route = tradeRoutes[caravan.routeId];
    if (!route) continue;
    const path = shortestPathRegions(world, route.from, route.to);
    if (!path.length || caravan.status !== 'Travel') continue;

    caravan.locationIndex += caravan.direction;

    if (caravan.locationIndex >= path.length - 1) {
      caravan.direction = -1;
      caravan.status = 'Arrived';
      const ownerFaction = world.factions[caravan.ownerFactionId];
      if (ownerFaction) ownerFaction.treasury += caravan.value;
      const event: WorldEvent = {
        id: `evt_${world.events.length}`,
        t: world.turn,
        kind: 'Treaty',
        a: caravan.ownerFactionId,
        b: 'Trade',
        terms: 'Truce',
      };
      world.events.push(event);
    } else if (caravan.locationIndex <= 0 && caravan.direction === -1) {
      caravan.status = 'Travel';
      caravan.direction = 1;
      caravan.value = Math.max(1, Math.round(caravan.value * 0.9));
    }
  }
}
