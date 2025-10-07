import { OverlayTheme as T } from './overlay.theme';

export function lerpHeat(value: number): string {
  const t = Math.max(0, Math.min(1, value / 6));
  const c1 = { r: 255, g: 120, b: 0, a: 0.15 };
  const c2 = { r: 255, g: 0, b: 0, a: 0.6 };
  const mix = (key: 'r' | 'g' | 'b' | 'a') => c1[key] + (c2[key] - c1[key]) * t;
  const r = Math.round(mix('r'));
  const g = Math.round(mix('g'));
  const b = Math.round(mix('b'));
  const a = Number(mix('a').toFixed(2));
  return `rgba(${r},${g},${b},${a})`;
}

export function drawPolygon(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]): void {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.strokeStyle = T.colors.formationStroke;
  ctx.stroke();
}

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  name: 'rotate' | 'refuse' | 'advance' | 'collapse',
  at: { x: number; y: number },
): void {
  ctx.fillStyle = T.colors.gestureText;
  ctx.font = '12px monospace';
  ctx.fillText(T.icons[name], at.x, at.y);
}

export function drawHeatCell(ctx: CanvasRenderingContext2D, at: { x: number; y: number }, value: number): void {
  ctx.fillStyle = lerpHeat(value);
  ctx.fillRect(at.x - 4, at.y - 4, 8, 8);
}

export function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.font = '12px monospace';
  let dy = 0;
  for (const item of T.legend) {
    dy += 14;
    ctx.fillText(`${item.icon} ${item.label}`, 0, dy);
  }
  ctx.restore();
}
