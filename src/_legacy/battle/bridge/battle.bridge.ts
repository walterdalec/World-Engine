
import type { BattleState } from '../types';
import type { WorldState, Army } from '../../strategy/ai/types';
import { createBattleContext } from './battle.factory';
import { initBattleFromContext } from './battle.init';
import { applyBattleModifiers } from './battle.adapt';
import type { BattleBridgeContext } from './types';

export interface LaunchedBattle {
  state: BattleState;
  context: BattleBridgeContext;
}

export function launchBattle(world: WorldState, armyA: Army, armyB: Army, baseState: BattleState): LaunchedBattle {
  const bridgeContext = createBattleContext(world, armyA, armyB);
  const enriched = initBattleFromContext(baseState, bridgeContext, armyA, armyB);
  applyBattleModifiers(enriched);
  return { state: enriched, context: bridgeContext };
}
