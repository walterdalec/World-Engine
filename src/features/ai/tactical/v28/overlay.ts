import { drawPolygon, drawIcon, drawHeatCell, drawLegend } from '../v29/overlay.render';

export interface OverlayPrimitive {
  kind: 'polygon' | 'icon' | 'heat';
  points?: { q: number; r: number }[];
  icon?: { name: string; hex: { q: number; r: number } };
  heat?: Array<{ hex: { q: number; r: number }; value: number }>;
}

type IconKey = 'rotate' | 'refuse' | 'advance' | 'collapse';

const GESTURE_ICON_MAP: Record<string, IconKey> = {
  rotate: 'rotate',
  rotate_left: 'rotate',
  rotate_right: 'rotate',
  wheel: 'rotate',
  refuse_left: 'refuse',
  refuse_right: 'refuse',
  advance_stage: 'advance',
  push: 'advance',
  collapse: 'collapse',
  fallback: 'collapse',
};

function toIconKey(name: string | undefined): IconKey | undefined {
  if (!name) return undefined;
  return GESTURE_ICON_MAP[name] ?? undefined;
}

export function buildOverlayFromReplay(replay: any, state: any): OverlayPrimitive[] {
  const primitives: OverlayPrimitive[] = [];
  if (!replay?.events) return primitives;

  for (const event of replay.events) {
    switch (event.kind) {
      case 'CommanderGesture':
        primitives.push({
          kind: 'icon',
          icon: {
            name: event.payload?.g ?? event.g,
            hex: event.payload?.anchor ?? { q: 0, r: 0 },
          },
        });
        break;
      case 'FormationAssign':
        if (Array.isArray(event.desired)) {
          primitives.push({ kind: 'polygon', points: event.desired.map((d: any) => d.pos).filter(Boolean) });
        }
        break;
      case 'DangerSnapshot':
        if (Array.isArray(event.cells)) {
          primitives.push({ kind: 'heat', heat: event.cells });
        }
        break;
      default:
        break;
    }
  }
  return primitives;
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  primitives: OverlayPrimitive[],
  hexToPx: (hex: { q: number; r: number }) => { x: number; y: number },
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const primitive of primitives) {
    if (primitive.kind === 'polygon' && primitive.points?.length) {
      const pts = primitive.points.map((hex) => hexToPx(hex));
      drawPolygon(ctx, pts);
    }
    if (primitive.kind === 'icon' && primitive.icon) {
      const pt = hexToPx(primitive.icon.hex);
      const iconKey = toIconKey(primitive.icon.name);
      if (iconKey) {
        drawIcon(ctx, iconKey, pt);
      } else {
        ctx.fillText(primitive.icon.name, pt.x, pt.y);
      }
    }
    if (primitive.kind === 'heat' && primitive.heat) {
      for (const cell of primitive.heat) {
        const pt = hexToPx(cell.hex);
        drawHeatCell(ctx, pt, cell.value);
      }
    }
  }
  drawLegend(ctx, 12, 18);
  ctx.restore();
}
