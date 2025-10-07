import { seasonalUnrestDecay } from './events';
import { getDifficulty } from './difficulty';
import { recomputeEconomy, moveCaravans, spawnCaravans } from './economy';
import {
  checkCaravanAmbushes,
  evaluateSupply,
  maintainArmies,
  planArmyOrders,
  advanceMarch,
  resolveArrivalsAndConflicts,
  tickSieges,
} from './military';
import { AIContext, WorldState } from './types';
import { seedRng } from './rng';
import {
  considerPeaceTerms,
  considerWarAndPeace,
  evaluateDiplomacy,
} from './diplomacy';
import { chooseSeasonalStances } from './military.stance';
import { considerTradeTreaties, applyTreatyBonuses } from './diplomacy.treaties';
import {
  spawnContraband,
  spawnSmugglers,
  moveSmugglers,
  rollSmugglerAmbush,
} from './economy.black';
import { frontlineRecruitmentBias, applyFortUpkeep } from './economy.frontline';
import { computeFrontlines } from './frontline';
import { assignArmyObjectives, scoreObjectiveProgress } from './objectives';
import { tickReparations } from './peace.variants';
import { rollSeasonalEconomyEvents } from './economy.events';
import { livingWorldActive, simulateLivingTick } from './integrations';
// TODO: AI tactical system is on feature/ai-tactical-system branch
// import { spawnCampaignEvents, applyEventEffects } from '../../ai/tactical/v29';

export function createAIContext(world: WorldState): AIContext {
  return {
    world,
    rand: seedRng(world.rngSeed + world.turn),
  };
}

export function simulateTick(world: WorldState) {
  const ctx = createAIContext(world);
  const difficulty = getDifficulty(world);

  recomputeEconomy(world);
  applyFortUpkeep(world);

  for (const faction of Object.values(world.factions)) {
    const delta = faction.income - faction.upkeep;
    const multiplier = faction.ai ? difficulty.aiIncomeMult : 1;
    faction.treasury = Math.round(faction.treasury + delta * multiplier);
  }

  for (const faction of Object.values(world.factions)) {
    evaluateDiplomacy(ctx, faction);
  }

  for (const faction of Object.values(world.factions)) {
    considerWarAndPeace(ctx, faction);
  }

  maintainArmies(ctx);
  evaluateSupply(ctx);

  for (const faction of Object.values(world.factions)) {
    planArmyOrders(ctx, faction);
  }

  advanceMarch(ctx);
  resolveArrivalsAndConflicts(ctx);
  tickSieges(ctx);

  // TODO: Available on feature/ai-tactical-system branch
  /*
  const campaignEvents = spawnCampaignEvents(world, world.turn);
  for (const ev of campaignEvents) {
    applyEventEffects(world, ev);
  }
  */

  checkCaravanAmbushes(ctx);
  moveCaravans(world);
  moveSmugglers(world);
  rollSmugglerAmbush(world, ctx.rand);

  if (livingWorldActive(world)) {
    simulateLivingTick(world);
  }

  for (const army of Object.values(world.armies)) {
    if (!army.objective) continue;
    if (scoreObjectiveProgress(world, army) > 0) {
      const reward = army.objective.reward ?? 0;
      const faction = world.factions[army.factionId];
      faction.treasury += reward;
      army.objective = undefined;
      continue;
    }
    if (army.objective.expiresTurn <= world.turn) {
      army.objective = undefined;
    }
  }

  for (const faction of Object.values(world.factions)) {
    considerPeaceTerms(ctx, faction);
  }

  world.turn += 1;
  if (world.turn % 12 === 0) {
    advanceSeason(world);

    rollSeasonalEconomyEvents(world);
    computeFrontlines(world);
    frontlineRecruitmentBias(world);

    const seasonalCtx = createAIContext(world);

    for (const faction of Object.values(world.factions)) {
      chooseSeasonalStances(seasonalCtx, faction);
    }

    for (const faction of Object.values(world.factions)) {
      considerTradeTreaties(seasonalCtx, faction);
    }

    applyTreatyBonuses(world);
    spawnContraband(world);
    spawnSmugglers(world, world.rngSeed + world.turn);
    spawnCaravans(world, world.rngSeed + world.turn);

    for (const faction of Object.values(world.factions)) {
      assignArmyObjectives(seasonalCtx, faction);
    }

    tickReparations(world);
  }
}

export function simulateSeason(world: WorldState) {
  for (let i = 0; i < 12; i += 1) {
    simulateTick(world);
  }
}

function advanceSeason(world: WorldState) {
  const order: ReadonlyArray<WorldState['season']> = [
    'Spring',
    'Summer',
    'Autumn',
    'Winter',
  ];
  const currentIndex = order.indexOf(world.season);
  const nextIndex = (currentIndex + 1) % order.length;
  world.season = order[nextIndex];
  seasonalUnrestDecay(world);
}
