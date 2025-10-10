import { RNG } from "./rng";
import type { BattleContext, Grid, Tile, TileKind, DeploymentZone } from "./types";
import { biomePalette, movementCost, blocked } from "./biomes";

/** Generate a top‑down grid from biome + site; includes spawn zones. */
export function generateBattlefield(ctx: BattleContext, width=20, height=14): { grid: Grid, friendly: DeploymentZone, enemy: DeploymentZone } {
  const rng = new RNG(ctx.seed + ":battlefield");
  const palette = biomePalette(ctx.biome);
  const tiles: Tile[] = [];
  for (let y=0;y<height;y++){
    for (let x=0;x<width;x++){
      let kind: TileKind = palette[rng.int(0, palette.length-1)];
      // Sprinkle features
      if (rng.next() < 0.05 && kind==="plain") kind = "cover";
      if (rng.next() < 0.03 && kind==="plain" && ctx.biome==="Desert") kind = "hazard";
      const t: Tile = { x, y, kind, movementCost: movementCost[kind], blocked: blocked[kind], cover: kind==="cover" ? 0.5 : 0 };
      tiles.push(t);
    }
  }
  // Carve roads if settlement
  if (ctx.biome === "Settlement") {
    for (let x=0;x<width;x++){
      const y = Math.floor(height/2);
      const i = y*width + x;
      tiles[i].kind = "road"; tiles[i].movementCost = movementCost.road; tiles[i].blocked = blocked.road;
    }
  }
  // Spawn zones (left/right columns)
  const friendly: DeploymentZone = { tiles: [] };
  const enemy: DeploymentZone = { tiles: [] };
  for (let y=2;y<height-2;y++){
    friendly.tiles.push({ x:1, y }); tiles[y*width+1].kind = "spawn_friendly";
    enemy.tiles.push({ x:width-2, y }); tiles[y*width+(width-2)].kind = "spawn_enemy";
  }
  return { grid: { width, height, tiles }, friendly, enemy };
}
