/**
 * Pixi v8 GPU-Accelerated Overworld Renderer
 * 
 * High-performance chunk-based terrain rendering with:
 * - Instanced tile rendering (1-2 draw calls per chunk)
 * - Marching-squares coastlines
 * - Spline-based rivers and roads
 * - Bayer dithering + LUT post-processing for retro aesthetic
 */

import * as PIXI from "pixi.js";
import { TileMesh } from "./TileMesh";
import { CoastBuilder, CoastMesh } from "./coast/CoastBuilder";
import { PathStripLayer } from "./paths/PathStripLayer";
import { DitherLUTFilter } from "./post/DitherLUTFilter";

export type TileIndex = number;

export interface ChunkData {
    x: number;               // chunk coord (not pixels)
    y: number;
    w: number;               // tiles wide
    h: number;               // tiles high
    tileIndex: Uint16Array;  // w*h tile IDs (already autotiled)
    uvs: Float32Array;       // per-tile UV rects (w*h*4: u0,v0,u1,v1) OR empty if using atlas resolver
    coastMask: Uint8Array;   // w*h water=1, land=0 (for marching squares)
    rivers?: Polyline[];     // world-space polylines (pixels)
    roads?: Polyline[];      // world-space polylines (pixels)
}

export interface Polyline {
    points: Float32Array;    // [x0,y0,x1,y1,...] world pixels
    baseWidth: number;       // in pixels at scale=1
    tint?: number;           // optional color
}

export interface OverworldConfig {
    tileSize: number;        // pixels per tile (world space)
    chunkSizeTiles: number;  // e.g., 64
    atlas: PIXI.Texture;     // tileset atlas
    // Optional: if you want to resolve UVs by index at runtime:
    atlasGrid?: { cols: number; rows: number }; // evenly split grid
    // Post look
    ditherStrength?: number; // 0..1
    lutTexture?: PIXI.Texture; // 256x1 or 1024x1 1D LUT
}

export class OverworldLayer extends PIXI.Container {
    readonly cfg: OverworldConfig;
    readonly tileLayer = new PIXI.Container();     // holds TileMesh by chunk
    readonly coastLayer = new PIXI.Container();    // holds CoastMesh by chunk
    readonly riverRoadLayer = new PIXI.Container();// holds PathStripLayer
    readonly postFilter: DitherLUTFilter;

    // book-keeping
    private tilesByKey = new Map<string, TileMesh>();
    private coastsByKey = new Map<string, CoastMesh>();
    private pathsByKey = new Map<string, PathStripLayer>();

    constructor(cfg: OverworldConfig) {
        super();
        this.cfg = cfg;

        this.addChild(this.tileLayer, this.coastLayer, this.riverRoadLayer);

        this.postFilter = new DitherLUTFilter({
            strength: cfg.ditherStrength ?? 0.18,
            lut: cfg.lutTexture ?? PIXI.Texture.WHITE,
        });
        // TODO: apply post filter once Pixi v8 Filter API is properly implemented
        // this.filters = [this.postFilter];
    }

    key(cx: number, cy: number) { return `${cx}:${cy}`; }

    upsertChunk(chunk: ChunkData) {
        const key = this.key(chunk.x, chunk.y);

        // --- Tiles
        let t = this.tilesByKey.get(key);
        if (!t) {
            t = new TileMesh({
                atlas: this.cfg.atlas,
                grid: this.cfg.atlasGrid,       // optional UV auto-resolve
                tileSize: this.cfg.tileSize,
                tilesW: chunk.w,
                tilesH: chunk.h,
            });
            // place chunk in world pixels
            t.position.set(
                chunk.x * this.cfg.chunkSizeTiles * this.cfg.tileSize,
                chunk.y * this.cfg.chunkSizeTiles * this.cfg.tileSize
            );
            this.tileLayer.addChild(t);
            this.tilesByKey.set(key, t);
        }
        t.updateTiles(chunk.tileIndex, chunk.uvs);

        // --- Coasts
        let c = this.coastsByKey.get(key);
        if (!c) {
            c = CoastBuilder.buildMesh(chunk.coastMask, chunk.w, chunk.h, this.cfg.tileSize);
            c.position.copyFrom(t.position);
            this.coastLayer.addChild(c);
            this.coastsByKey.set(key, c);
        } else {
            CoastBuilder.updateMesh(c, chunk.coastMask, chunk.w, chunk.h, this.cfg.tileSize);
        }

        // --- Rivers + Roads (single layer per chunk)
        let p = this.pathsByKey.get(key);
        if (!p) {
            p = new PathStripLayer();
            p.position.copyFrom(t.position);
            this.riverRoadLayer.addChild(p);
            this.pathsByKey.set(key, p);
        }
        p.clear();
        if (chunk.rivers) {
            for (const r of chunk.rivers) {
                p.addPath(r.points, r.baseWidth, r.tint ?? 0x2E90FF, /*feather*/ 1.75);
            }
        }
        if (chunk.roads) {
            for (const rd of chunk.roads) {
                p.addPath(rd.points, rd.baseWidth, rd.tint ?? 0x9a7b53, /*feather*/ 1.2);
            }
        }
        p.upload();
    }

    removeChunk(cx: number, cy: number) {
        const key = this.key(cx, cy);
        const t = this.tilesByKey.get(key);
        if (t) { t.destroy({ children: true }); this.tilesByKey.delete(key); }
        const c = this.coastsByKey.get(key);
        if (c) { c.destroy({ children: true }); this.coastsByKey.delete(key); }
        const p = this.pathsByKey.get(key);
        if (p) { p.destroy({ children: true }); this.pathsByKey.delete(key); }
    }

    setDitherStrength(v: number) {
        this.postFilter.uniforms.uStrength = v;
    }

    setLUT(tex: PIXI.Texture) {
        this.postFilter.uniforms.uLUT = tex;
    }
}
