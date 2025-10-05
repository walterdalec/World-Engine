
import { seedRng, rngInt } from './rng';
import {
  ContrabandRoute,
  ID,
  Smuggler,
  WorldState,
} from './types';
import { shortestPathRegions } from './world';

export function spawnContraband(world: WorldState) {
  if (!world.contraband) world.contraband = {};
  const contraband = world.contraband;
  const hotbeds = Object.values(world.regions).filter((region) => region.unrest >= 70);

  for (const region of hotbeds) {
    const rival = nearestHostileSettlement(world, region.id);
    if (!rival) continue;
    const existing = Object.values(contraband).some(
      (route) => route.from === region.id && route.to === rival.id
    );
    if (existing) continue;

    const id = `contra_${Object.keys(contraband).length}`;
    contraband[id] = {
      id,
      from: region.id,
      to: rival.id,
      valuePerSeason: Math.round((region.wealth + rival.wealth) / 2),
      risk: Math.min(100, 50 + Math.round((region.unrest + rival.unrest) / 2)),
    } satisfies ContrabandRoute;
  }
}

export function spawnSmugglers(world: WorldState, seasonSeed: number) {
  if (!world.contraband) return;
  if (!world.smugglers) world.smugglers = {};
  const rand = seedRng(seasonSeed);

  for (const route of Object.values(world.contraband)) {
    if (rand() >= 0.35) continue;
    const id = `smug_${Object.keys(world.smugglers).length}`;
    const smuggler: Smuggler = {
      id,
      routeId: route.id,
      value: Math.max(10, Math.round(route.valuePerSeason * (0.5 + rand()))),
      stealth: rngInt(rand, 30, 85),
      locationIndex: 0,
      direction: 1,
      status: 'Travel',
    };
    world.smugglers[id] = smuggler;
    route.activeSmugglerId = id;
  }
}

export function moveSmugglers(world: WorldState) {
  if (!world.smugglers || !world.contraband) return;

  for (const smuggler of Object.values(world.smugglers)) {
    if (smuggler.status !== 'Travel') continue;
    const route = world.contraband[smuggler.routeId];
    if (!route) continue;
    const path = shortestPathRegions(world, route.from, route.to);
    if (!path.length) continue;

    smuggler.locationIndex += smuggler.direction;

    if (smuggler.locationIndex >= path.length - 1) {
      smuggler.direction = -1;
      smuggler.status = 'Arrived';
    } else if (smuggler.locationIndex <= 0 && smuggler.direction === -1) {
      smuggler.status = 'Travel';
      smuggler.direction = 1;
      smuggler.value = Math.max(10, Math.round(smuggler.value * 0.85));
    }
  }
}

export function rollSmugglerAmbush(world: WorldState, rand: () => number) {
  if (!world.smugglers || !world.contraband) return;

  for (const smuggler of Object.values(world.smugglers)) {
    if (smuggler.status !== 'Travel') continue;
    const route = world.contraband[smuggler.routeId];
    if (!route) continue;
    const risk = route.risk + rngInt(rand, -10, 10);

    if (risk > 100 && rand() > smuggler.stealth / 120) {
      smuggler.status = 'Intercepted';
      if (rand() < 0.5) {
        smuggler.value = Math.max(10, Math.round(smuggler.value * 0.6));
        smuggler.status = 'Travel';
      } else {
        smuggler.status = 'Destroyed';
      }
    }
  }
}

function nearestHostileSettlement(world: WorldState, from: ID) {
  const region = world.regions[from];
  if (!region) return null;
  const owner = region.ownerId;

  let best: { id: ID; distance: number; wealth: number } | null = null;

  for (const candidate of Object.values(world.regions)) {
    if (candidate.biome !== 'Settlement') continue;
    if (!candidate.ownerId) continue;
    if (owner && candidate.ownerId === owner) continue;

    const path = shortestPathRegions(world, from, candidate.id);
    if (!path.length) continue;

    if (!best || path.length < best.distance) {
      best = { id: candidate.id, distance: path.length, wealth: candidate.wealth };
    }
  }

  return best ? world.regions[best.id] : null;
}
