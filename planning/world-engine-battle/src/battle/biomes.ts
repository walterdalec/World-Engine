import type { Biome, TileKind } from "./types";

/** Map world biome/site → tile palette for battlefield generation */
export function biomePalette(biome: Biome): TileKind[] {
  switch (biome) {
    case "Forest": return ["plain","forest","forest","cover","road"];
    case "Grass": return ["plain","plain","cover","road"];
    case "Desert": return ["sand","sand","plain","hazard"];
    case "Swamp": return ["swamp","swamp","plain","hazard"];
    case "Mountain": return ["rough","rough","plain","cover"];
    case "Snow": return ["snow","snow","plain","cover"];
    case "Settlement": return ["road","plain","cover","wall"];
    case "Dungeon": return ["wall","plain","cover","hazard"];
    default: return ["plain","plain","cover"];
  }
}

/** Base movement cost per tile kind */
export const movementCost: Record<TileKind, number> = {
  plain: 1, forest: 2, rough: 2, sand: 2, water: 99, swamp: 3, snow: 2,
  road: 1, wall: 99, cover: 1, hazard: 2, spawn_friendly: 1, spawn_enemy: 1
};

/** Blocking flags per tile kind */
export const blocked: Record<TileKind, boolean> = {
  plain: false, forest: false, rough: false, sand: false, water: true, swamp: false, snow: false,
  road: false, wall: true, cover: false, hazard: false, spawn_friendly: false, spawn_enemy: false
};
