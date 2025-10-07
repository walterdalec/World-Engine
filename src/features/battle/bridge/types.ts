import type { ID, WeatherCell, Personality } from '../../strategy/ai/types';
import type { BattleContext, CommanderIntent } from '../types';

export interface BattleBridgeContext {
  seed: number;
  regionId: ID;
  weather: WeatherCell;
  moraleMod: number;
  supplyMod: number;
  commanderIntent: CommanderIntent;
  commanderPersonality?: Personality;
  terrainTags: string[];
  baseContext: BattleContext;
  cultureId?: string;
  enemyFactionId?: ID;
  enemyCultureId?: string;
}
