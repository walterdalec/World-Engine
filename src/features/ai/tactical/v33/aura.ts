import type { Hex } from '../v30/field';

export interface AuraSpec {
  radius: number;
  strength: number;
}

export function auraAt(commanderPos: Hex, unitPos: Hex, spec: AuraSpec): number {
  const distance = hexDist(commanderPos, unitPos);
  if (distance > spec.radius) return 0;
  const falloff = 1 - distance / Math.max(1, spec.radius);
  return clamp(spec.strength * falloff, 0, 1);
}

function hexDist(a: Hex, b: Hex): number {
  const ax = a.q;
  const ay = a.r;
  const az = -ax - ay;
  const bx = b.q;
  const by = b.r;
  const bz = -bx - by;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
