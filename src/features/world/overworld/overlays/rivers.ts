import type { TerrainOverlayDefinition, TerrainOverlayContext } from '../../terrain/pixiTerrainRenderer';
import type { RiverGenerator } from '../../terrain/riverGenerator';

type RiverStyle = {
    color: string;      // main river color
    foam: string;       // highlight color for steeper segments
    minWidth: number;   // px at source
    maxWidth: number;   // px at mouth
    foamSlope: number;  // threshold for foam accent
    alpha: number;      // overlay opacity
};

const DEFAULT_RIVER_STYLE: RiverStyle = {
    color: '#2E90FF',
    foam: '#BEE3FF',
    minWidth: 1.5,
    maxWidth: 6.0,
    foamSlope: 0.9,  // bigger = fewer foam highlights
    alpha: 0.9,
};

// tiny LCG for stable marsh shapes
function seeded(seed: number) {
    let s = (seed >>> 0) || 1;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return (s & 0xffffffff) / 0xffffffff;
    };
}

export function makeRiversOverlay(
    id: string,
    rivers: RiverGenerator,
    style: Partial<RiverStyle> = {}
): TerrainOverlayDefinition {
    const S = { ...DEFAULT_RIVER_STYLE, ...style };

    return {
        id,
        opacity: S.alpha,
        zIndex: 5,
        paint: (ctx: CanvasRenderingContext2D, context: TerrainOverlayContext) => {
            const { options } = context;
            const seaLevel = options.seaLevel;

            // Pull polylines in pixel space
            const polys = rivers.getRivers();
            if (!polys?.length) return;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = S.color;

            for (const river of polys) {
                const pts = river.segments;
                if (!pts || pts.length < 2) continue;

                // total length (for width ramp)
                let length = 0;
                for (let i = 0; i < pts.length - 1; i++) {
                    const dx = pts[i + 1].x - pts[i].x;
                    const dy = pts[i + 1].y - pts[i].y;
                    length += Math.hypot(dx, dy);
                }

                // stroke segments with width ramp + optional foam on steeper parts
                let acc = 0;
                for (let i = 0; i < pts.length - 1; i++) {
                    const a = pts[i], b = pts[i + 1];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const segLen = Math.max(1, Math.hypot(dx, dy));
                    const t0 = acc / length;
                    const t1 = (acc + segLen) / length;
                    acc += segLen;

                    const w0 = S.minWidth + (S.maxWidth - S.minWidth) * t0;
                    const w1 = S.minWidth + (S.maxWidth - S.minWidth) * t1;
                    const w = (w0 + w1) * 0.5;

                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.lineWidth = w;
                    ctx.stroke();

                    // foam where local slope is steeper
                    const ea = rivers.getElevation(Math.floor(a.x), Math.floor(a.y), (_x: number, _y: number) => 0);
                    const eb = rivers.getElevation(Math.floor(b.x), Math.floor(b.y), (_x: number, _y: number) => 0);
                    const slope = Math.abs(ea - eb) / segLen;
                    if (slope > S.foamSlope / 1000) {
                        ctx.strokeStyle = S.foam;
                        ctx.lineWidth = Math.max(1, w * 0.45);
                        ctx.stroke();
                        ctx.strokeStyle = S.color;
                    }
                }

                // Delta / marsh at the end if not reaching sea
                const end = pts[pts.length - 1];
                const elevEnd = rivers.getElevation(Math.floor(end.x), Math.floor(end.y), (_x: number, _y: number) => 0);

                if (elevEnd > seaLevel + 0.01) {
                    // paint a marsh fan using semi-random ellipses
                    const rng = seeded(end.x * 73856093 ^ end.y * 19349663);
                    const fan = 8 + Math.floor(rng() * 6);
                    const base = S.maxWidth * 1.25;
                    for (let k = 0; k < fan; k++) {
                        const ang = (rng() - 0.5) * Math.PI * 0.6; // ± ~54°
                        const dist = base + rng() * base * 1.5;
                        const cx = end.x + Math.cos(ang) * dist * 0.6;
                        const cy = end.y + Math.sin(ang) * dist * 0.35;
                        const rx = base * (1.0 + rng() * 1.5);
                        const ry = base * 0.35 * (1.0 + rng() * 1.2);
                        ctx.fillStyle = options.palette.SWAMP;
                        ctx.globalAlpha = 0.35 + rng() * 0.25;
                        ctx.beginPath();
                        ctx.ellipse(cx, cy, rx, ry, ang, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.globalAlpha = 1;
                }
            }
        }
    };
}
