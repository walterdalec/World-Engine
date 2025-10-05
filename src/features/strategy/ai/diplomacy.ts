import { rngBool } from './rng';
import { computeFactionScores } from './scoring';
import { AIContext, Faction, ID, WarTerms, WorldState } from './types';
import { acceptPeace, proposePeaceDeal } from './peace.variants';
import { getModifiedRelation } from './memory';

export function evaluateDiplomacy(ctx: AIContext, faction: Faction) {
  const { world, rand } = ctx;
  const scores = computeFactionScores(world, faction.id);

  for (const other of Object.values(world.factions)) {
    if (other.id === faction.id) continue;
    const effectiveRelation = getModifiedRelation(faction, other.id);
    const baseRelation = faction.relations[other.id] ?? 0;
    const borderFriction = sharedBorderCount(world, faction.id, other.id) * -5;
    const otherScores = computeFactionScores(world, other.id);
    const powerDiff = scores.power - otherScores.power;

    let delta = borderFriction + Math.sign(powerDiff) * 2;
    if (effectiveRelation > 60) delta += 2;
    if (effectiveRelation < -60) delta -= 2;
    delta += rngBool(rand, 0.3) ? 1 : -1;

    faction.relations[other.id] = clamp(baseRelation + delta, -100, 100);
  }
}

export function sharedBorderCount(world: WorldState, a: ID, b?: ID, regionId?: ID) {
  let count = 0;
  const regions = regionId
    ? [world.regions[regionId]].filter((region): region is NonNullable<typeof region> => Boolean(region))
    : Object.values(world.regions);

  for (const region of regions) {
    if (!region || region.ownerId !== a) continue;
    for (const neighborId of region.neighbors) {
      const owner = world.regions[neighborId]?.ownerId;
      if (b) {
        if (owner === b) count += 1;
      } else if (owner && owner !== a) {
        count += 1;
      }
    }
  }

  return count;
}

export function considerWarAndPeace(ctx: AIContext, faction: Faction) {
  const { world, rand } = ctx;
  const aggressionBias = world.difficulty?.aiAggressionBias ?? 0;

  for (const other of Object.values(world.factions)) {
    if (other.id === faction.id) continue;
    const attitude = getModifiedRelation(faction, other.id);
    const atWar = Boolean(faction.wars[other.id]);

    if (
      !atWar &&
      attitude < -40 &&
      rngBool(rand, (faction.ai.aggression + aggressionBias) / 150)
    ) {
      faction.wars[other.id] = {
        enemyId: other.id,
        startTurn: world.turn,
        warScore: 0,
        battles: [],
      };
      other.wars[faction.id] = {
        enemyId: faction.id,
        startTurn: world.turn,
        warScore: 0,
        battles: [],
      };
    }

    if (atWar) {
      const war = faction.wars[other.id]!;
      if (war.warScore < -35 && rngBool(rand, (faction.ai.diplomacy + 30) / 150)) {
        finalizePeace(world, faction.id, other.id);
      }
    }
  }
}

export function applyWarScore(
  world: WorldState,
  attackerId: ID,
  defenderId: ID,
  outcome: { winner: 'A' | 'B' | 'Stalemate'; delta: number }
) {
  const attacker = world.factions[attackerId];
  const defender = world.factions[defenderId];
  if (!attacker || !defender) return;
  const attackerWar = attacker.wars[defenderId];
  const defenderWar = defender.wars[attackerId];
  if (!attackerWar || !defenderWar) return;

  const swing = outcome.winner === 'A' ? 8 : outcome.winner === 'B' ? -8 : 0;
  attackerWar.warScore = clamp(attackerWar.warScore + swing + outcome.delta * 0.1, -100, 100);
  defenderWar.warScore = clamp(defenderWar.warScore - swing - outcome.delta * 0.1, -100, 100);
}

export function applyCaptureWarScore(world: WorldState, captorId: ID, loserId: ID, regionId: ID) {
  const captor = world.factions[captorId];
  const loser = world.factions[loserId];
  if (!captor || !loser) return;
  const captorWar = captor.wars[loserId];
  const loserWar = loser.wars[captorId];
  if (!captorWar || !loserWar) return;

  const region = world.regions[regionId];
  if (!region) return;
  const value = region.wealth;
  const swing = Math.min(25, 5 + Math.floor(value / 5));
  captorWar.warScore = clamp(captorWar.warScore + swing, -100, 100);
  loserWar.warScore = clamp(loserWar.warScore - swing, -100, 100);
}

export function considerPeaceTerms(ctx: AIContext, faction: Faction) {
  const { world } = ctx;
  for (const enemyId of Object.keys(faction.wars)) {
    const war = faction.wars[enemyId];
    if (!war) continue;

    const proposals = proposePeaceDeal(world, faction.id, enemyId, war.warScore);
    if (!proposals.length) continue;

    const selected = proposals[proposals.length - 1];
    acceptPeace(world, faction.id, enemyId, selected);
  }
}

export function finalizePeace(world: WorldState, aId: ID, bId: ID, _terms?: WarTerms) {
  const factionA = world.factions[aId];
  const factionB = world.factions[bId];
  if (!factionA || !factionB) return;
  void _terms;
  delete factionA.wars[bId];
  delete factionB.wars[aId];
  factionA.relations[bId] = Math.min(0, (factionA.relations[bId] ?? -20) + 15);
  factionB.relations[aId] = Math.min(0, (factionB.relations[aId] ?? -20) + 15);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
