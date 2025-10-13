/**
 * Instanced Tile Mesh Renderer (Pixi v8 API)
 * 
 * Renders thousands of tiles efficiently using Pixi v8's sprite batching.
 * Simplified implementation using Container + TilingSprite for compatibility.
 * 
 * NOTE: Full GPU instancing requires custom WebGL renderer.
 * This version uses Pixi's built-in batching which is still very fast.
 */

import * as PIXI from "pixi.js";

export interface TileMeshOpts {
  atlas: PIXI.Texture;
  grid?: { cols: number; rows: number }; // evenly split atlas (optional)
  tileSize: number;
  tilesW: number;
  tilesH: number;
}

/**
 * Batch-rendered tile grid using Pixi v8's sprite batching.
 * Creates one sprite per tile, but Pixi batches them automatically.
 */
export class TileMesh extends PIXI.Container {
  private opts: TileMeshOpts;
  private sprites: PIXI.Sprite[] = [];

  constructor(opts: TileMeshOpts) {
    super();
    this.opts = opts;
  }

  updateTiles(tileIndex: Uint16Array, uvs: Float32Array | null) {
    const { tilesW, tilesH, tileSize, grid, atlas } = this.opts;
    const N = tilesW * tilesH;
    if (tileIndex.length !== N) throw new Error("tileIndex length mismatch");

    // Clear existing sprites
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.removeChildren();
    this.sprites.length = 0;

    // Helper for grid UVs
    const cols = grid?.cols ?? 1;
    const rows = grid?.rows ?? 1;
    const tileWidth = atlas.width / cols;
    const tileHeight = atlas.height / rows;

    let i = 0;
    for (let y = 0; y < tilesH; y++) {
      for (let x = 0; x < tilesW; x++, i++) {
        const idx = tileIndex[i];
        
        // Calculate texture region
        let tileTexture: PIXI.Texture;
        if (uvs && uvs.length === N * 4) {
          // Use provided UVs
          const u0 = uvs[i*4+0], v0 = uvs[i*4+1], u1 = uvs[i*4+2], v1 = uvs[i*4+3];
          const frame = new PIXI.Rectangle(
            u0 * atlas.width,
            v0 * atlas.height,
            (u1 - u0) * atlas.width,
            (v1 - v0) * atlas.height
          );
          tileTexture = new PIXI.Texture({
            source: atlas.source,
            frame
          });
        } else {
          // Use grid coordinates
          const cx = idx % cols;
          const cy = Math.floor(idx / cols);
          const frame = new PIXI.Rectangle(
            cx * tileWidth,
            cy * tileHeight,
            tileWidth,
            tileHeight
          );
          tileTexture = new PIXI.Texture({
            source: atlas.source,
            frame
          });
        }

        // Create sprite
        const sprite = new PIXI.Sprite(tileTexture);
        sprite.x = x * tileSize;
        sprite.y = y * tileSize;
        sprite.width = tileSize;
        sprite.height = tileSize;
        
        this.addChild(sprite);
        this.sprites.push(sprite);
      }
    }
  }

  destroy(_options?: boolean | PIXI.DestroyOptions): void {
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.sprites.length = 0;
    super.destroy(_options);
  }
}
