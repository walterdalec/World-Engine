
import type { Army } from '../../strategy/ai/types';
import type { BattleState, CommanderIntent, CommanderAIProfile, BattleEnvironment } from '../types';
import type { BattleBridgeContext } from './types';

export function initBattleFromContext(base: BattleState, ctx: BattleBridgeContext, armyA: Army, armyB: Army): BattleState {
  const state: BattleState = {
    ...base,
    context: {
      ...base.context,
      seed: ctx.baseContext.seed,
      biome: ctx.baseContext.biome,
      site: ctx.baseContext.site ?? base.context.site,
      weather: ctx.baseContext.weather,
      weatherDetail: ctx.weather,
      moraleShift: ctx.moraleMod,
      supplyShift: ctx.supplyMod,
      commanderIntent: ctx.commanderIntent,
      terrainTags: ctx.terrainTags,
      personality: ctx.baseContext.personality ?? base.context.personality,
      cultureId: ctx.baseContext.cultureId ?? base.context.cultureId,
      enemyFactionId: ctx.baseContext.enemyFactionId ?? base.context.enemyFactionId,
      enemyPlaybookId: ctx.baseContext.enemyPlaybookId ?? base.context.enemyPlaybookId,
    },
    environment: buildEnvironment(ctx, base),
    commandersAI: {
      A: buildCommanderAI(ctx.commanderIntent),
      B: buildCommanderAI(invertIntent(ctx.commanderIntent, armyB)),
    },
    modifiers: base.modifiers ?? [],
  };

  return state;
}

function buildCommanderAI(intent: CommanderIntent): CommanderAIProfile {
  return {
    stance: intent.stance,
    risk: intent.riskTolerance,
    objective: intent.objective,
    currentFocus: intent.focusRegionId,
  };
}

function invertIntent(intent: CommanderIntent, opposing: Army): CommanderIntent {
  const flip = intent.stance === 'Aggressive' ? 'Defensive' : intent.stance === 'Defensive' ? 'Aggressive' : 'Opportunistic';
  return {
    stance: flip,
    objective: opposing.objective ? mapObjective(opposing.objective.kind) : intent.objective,
    riskTolerance: Math.min(100, Math.max(0, opposing.morale ?? 50)),
    focusRegionId: opposing.objective?.targetRegionId ?? opposing.locationRegionId,
  };
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

function buildEnvironment(ctx: BattleBridgeContext, base: BattleState): BattleEnvironment {
  return {
    biome: ctx.terrainTags[0] ?? base.context.biome,
    weather: ctx.weather,
    moraleShift: ctx.moraleMod,
    supplyShift: ctx.supplyMod,
  };
}
