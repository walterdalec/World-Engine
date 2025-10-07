
import type { BattleBridgeContext } from './types';

export function snapshotBridge(ctx: BattleBridgeContext) {
  return {
    region: ctx.regionId,
    stance: ctx.commanderIntent.stance,
    morale: ctx.moraleMod,
    supply: ctx.supplyMod,
    weather: ctx.weather,
    terrain: ctx.terrainTags.join(','),
  };
}
