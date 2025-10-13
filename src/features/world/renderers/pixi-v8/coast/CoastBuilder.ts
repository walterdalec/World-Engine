/**
 * Coastline Builder using Marching Squares
 * 
 * Generates smooth coastline meshes from water/land masks.
 * Uses marching squares algorithm to create vector coastlines.
 */

import * as PIXI from "pixi.js";

export class CoastMesh extends PIXI.Graphics { }

export const CoastBuilder = {
    buildMesh(mask: Uint8Array, w: number, h: number, tileSize: number): CoastMesh {
        const mesh = new CoastMesh();
        this.renderCoast(mesh, mask, w, h, tileSize);
        return mesh;
    },

    updateMesh(mesh: CoastMesh, mask: Uint8Array, w: number, h: number, tile: number) {
        mesh.clear();
        this.renderCoast(mesh, mask, w, h, tile);
    },

    renderCoast(graphics: PIXI.Graphics, mask: Uint8Array, w: number, h: number, tile: number) {
        // Marching squares algorithm for coastlines
        // Very simple implementation: draw lines at water/land boundaries

        const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h) ? 1 : mask[y * w + x];

        // Pixi v8 Graphics API: stroke() method
        graphics.setStrokeStyle({
            width: 2.5,
            color: 0x1c4966,
            alpha: 0.8,
            cap: 'round',
            join: 'round'
        });

        for (let y = 0; y < h - 1; y++) {
            for (let x = 0; x < w - 1; x++) {
                const tl = at(x, y);
                const tr = at(x + 1, y);
                const bl = at(x, y + 1);
                const br = at(x + 1, y + 1);
                const code = (tl << 3) | (tr << 2) | (bl << 1) | br;

                // Skip if fully land or fully water
                if (code === 0 || code === 15) continue;

                const x0 = x * tile;
                const y0 = y * tile;
                const x1 = (x + 1) * tile;
                const y1 = (y + 1) * tile;
                const xm = (x0 + x1) / 2;
                const ym = (y0 + y1) / 2;

                // Draw coastline segments based on marching squares configuration
                // Simplified: draw lines along the edges where land meets water
                switch (code) {
                    case 1:  // Bottom-left only water
                        graphics.moveTo(x0, ym);
                        graphics.lineTo(xm, y1);
                        break;
                    case 2:  // Bottom-right only water
                        graphics.moveTo(xm, y1);
                        graphics.lineTo(x1, ym);
                        break;
                    case 3:  // Bottom row water
                        graphics.moveTo(x0, ym);
                        graphics.lineTo(x1, ym);
                        break;
                    case 4:  // Top-right only water
                        graphics.moveTo(xm, y0);
                        graphics.lineTo(x1, ym);
                        break;
                    case 5:  // Diagonal TR-BL water
                        graphics.moveTo(x0, ym);
                        graphics.lineTo(xm, y0);
                        graphics.moveTo(xm, y1);
                        graphics.lineTo(x1, ym);
                        break;
                    case 6:  // Right column water
                        graphics.moveTo(xm, y0);
                        graphics.lineTo(xm, y1);
                        break;
                    case 7:  // All but TL water
                        graphics.moveTo(x0, ym);
                        graphics.lineTo(xm, y0);
                        break;
                    case 8:  // Top-left only water
                        graphics.moveTo(x0, ym);
                        graphics.lineTo(xm, y0);
                        break;
                    case 9:  // Left column water
                        graphics.moveTo(xm, y0);
                        graphics.lineTo(xm, y1);
                        break;
                    case 10: // Diagonal TL-BR water
                        graphics.moveTo(x0, ym);
                        graphics.lineTo(xm, y1);
                        graphics.moveTo(xm, y0);
                        graphics.lineTo(x1, ym);
                        break;
                    case 11: // All but TR water
                        graphics.moveTo(xm, y0);
                        graphics.lineTo(x1, ym);
                        break;
                    case 12: // Top row water
                        graphics.moveTo(x0, ym);
                        graphics.lineTo(x1, ym);
                        break;
                    case 13: // All but BR water
                        graphics.moveTo(xm, y1);
                        graphics.lineTo(x1, ym);
                        break;
                    case 14: // All but BL water
                        graphics.moveTo(x0, ym);
                        graphics.lineTo(xm, y1);
                        break;
                }
            }
        }
    }
};
