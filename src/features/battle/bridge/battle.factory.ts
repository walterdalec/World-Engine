
import { seedRng } from '../../strategy/ai/rng';
import { getRegionWeather } from '../../strategy/ai/weather';
import type { WorldState, Army, Region } from '../../strategy/ai/types';
import type { BattleContext, CommanderIntent } from '../types';
import type { BattleBridgeContext } from './types';

export function createBattleContext(world: WorldState, armyA: Army, armyB: Army): BattleBridgeContext {
  const region = world.regions[armyA.locationRegionId];
  const rng = seedRng(world.rngSeed + world.turn * 997 + (region?.id?.length ?? 0));
  const seed = Math.floor(rng() * 10_000_000);
  const weather = getRegionWeather(world, region?.id ?? armyA.locationRegionId);
  const terrainTags = deriveTerrainTags(region);
  const commanderIntent = deriveCommanderIntent(armyA, region);
  const faction = world.factions?.[armyA.factionId];
  const commanderPersonality = faction?.personality;
  const cultureId = faction?.cultureId;
  const enemyFaction = world.factions?.[armyB.factionId];
  const enemyCultureId = enemyFaction?.cultureId;

  const moraleShift = getMoraleAverage([armyA, armyB]);
  const supplyShift = getSupplyAverage([armyA, armyB]);

  const baseContext = {
    seed: String(seed),
    biome: region?.biome ?? 'Grass',
    site: (region && region.biome === 'Settlement' ? 'settlement' : 'wilds') as BattleContext['site'],
    weather: describeWeather(weather),
    weatherDetail: weather,
    moraleShift,
    supplyShift,
    commanderIntent,
    terrainTags,
    personality: commanderPersonality,
    cultureId,
    enemyFactionId: armyB.factionId,
    enemyPlaybookId: enemyCultureId,
  };

  return {
    seed,
    regionId: region?.id ?? armyA.locationRegionId,
    weather,
    moraleMod: moraleShift,
    supplyMod: supplyShift,
    commanderIntent,
    commanderPersonality,
    terrainTags,
    baseContext,
    cultureId,
    enemyFactionId: armyB.factionId,
    enemyCultureId,
  };
}

function getMoraleAverage(armies: Army[]): number {
  if (!armies.length) return 0;
  const total = armies.reduce((sum, army) => sum + (army.morale ?? 50), 0);
  return Math.round(total / armies.length) - 50;
}

function getSupplyAverage(armies: Army[]): number {
  if (!armies.length) return 0;
  const total = armies.reduce((sum, army) => sum + (army.supplies ?? 50), 0);
  return Math.round((total / armies.length) / 100 * 2 - 1);
}

function deriveCommanderIntent(army: Army, region?: Region): CommanderIntent {
  const objectiveKind = army.objective?.kind ?? 'HoldRegion';
  const stance = mapObjectiveToStance(objectiveKind);
  const risk = Math.min(100, Math.max(0, (army.morale ?? 50) + (army.supplies ?? 50) / 2));
  return {
    stance,
    objective: mapObjective(objectiveKind),
    riskTolerance: risk,
    focusRegionId: army.objective?.targetRegionId ?? region?.id ?? army.locationRegionId,
  };
}

function mapObjectiveToStance(kind: string): CommanderIntent['stance'] {
  switch (kind) {
    case 'RaidRoute':
    case 'SeizeRegion':
      return 'Aggressive';
    case 'EscortCaravan':
      return 'Opportunistic';
    default:
      return 'Defensive';
  }
}

function mapObjective(kind: string): CommanderIntent['objective'] {
  switch (kind) {
    case 'SeizeRegion':
      return 'Seize';
    case 'RaidRoute':
      return 'Raid';
    case 'EscortCaravan':
      return 'Escort';
    default:
      return 'Hold';
  }
}

function deriveTerrainTags(region?: Region): string[] {
  if (!region) return [];
  const tags = new Set<string>();
  tags.add(region.biome);
  if (region.fort && region.fort > 0) tags.add('Fortified');
  if (region.unrest > 60) tags.add('Unrest');
  return Array.from(tags);
}

function describeWeather(weather: ReturnType<typeof getRegionWeather>): string {
  if (weather.precipitation > 70) return 'Stormy';
  if (weather.temperature < 0) return 'Freezing';
  if (weather.temperature > 30) return 'Scorching';
  if (weather.wind > 40) return 'Windy';
  return 'Mild';
}
