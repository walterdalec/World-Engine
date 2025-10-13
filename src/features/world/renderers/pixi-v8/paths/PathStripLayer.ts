/**
 * Path Strip Layer - Rivers and Roads
 * 
 * Renders smooth polyline paths (rivers, roads) as stroked lines.
 * Batches multiple paths into one Graphics object for performance.
 */

import * as PIXI from "pixi.js";

export class PathStripLayer extends PIXI.Container {
    private graphics?: PIXI.Graphics;

    clear() {
        if (this.graphics) {
            this.graphics.destroy();
            this.removeChildren();
        }
        this.graphics = undefined;
    }

    addPath(points: Float32Array, baseWidth: number, tint: number, _feather: number) {
        if (points.length < 4) return;

        if (!this.graphics) {
            this.graphics = new PIXI.Graphics();
            this.addChild(this.graphics);
        }

        // Pixi v8 Graphics API
        this.graphics.setStrokeStyle({
            width: baseWidth,
            color: tint,
            alpha: 1.0,
            cap: 'round',
            join: 'round'
        });

        // Draw the polyline
        this.graphics.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            this.graphics.lineTo(points[i], points[i + 1]);
        }
        this.graphics.stroke();
    }

    upload() {
        // No-op in Pixi v8 - Graphics are automatically batched
    }

    destroy(_options?: boolean | PIXI.DestroyOptions): void {
        if (this.graphics) {
            this.graphics.destroy();
        }
        super.destroy(_options);
    }
}
