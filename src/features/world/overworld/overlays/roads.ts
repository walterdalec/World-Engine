import type { TerrainOverlayDefinition } from '../../terrain/pixiTerrainRenderer';

export type Road = {
    points: Array<{ x: number; y: number }>;
    width?: number;
    tint?: string;
    alpha?: number;
};

export function makeRoadsOverlay(id: string, roads: Road[]): TerrainOverlayDefinition {
    return {
        id,
        zIndex: 6, // above rivers if needed
        opacity: 1,
        paint: (ctx) => {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (const r of roads) {
                const pts = r.points;
                if (!pts || pts.length < 2) continue;
                ctx.globalAlpha = r.alpha ?? 0.9;
                ctx.strokeStyle = r.tint ?? '#9a7b53';
                ctx.lineWidth = r.width ?? 3;

                // stroke
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                ctx.stroke();

                // subtle inner highlight to seat the road visually
                ctx.globalAlpha = (r.alpha ?? 0.9) * 0.35;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = Math.max(1, (r.width ?? 3) * 0.35);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    };
}
