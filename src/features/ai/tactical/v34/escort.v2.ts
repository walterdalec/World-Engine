import type { Hex } from '../v30/field';

export interface EscortFormation {
  engineer: string;
  escorts: string[];
  shieldAngle: number;
  formation: 'Line' | 'Wedge' | 'Box';
  ready: boolean;
}

export interface EscortStateContext {
  unitById: Record<string, any>;
  terrain?: any;
}

export function formEscortFormation(task: any, units: any[], anchor: Hex): EscortFormation | null {
  const engineer = units.find(u => u.role === 'Siege') ?? units.find(u => u.role === 'Infantry');
  const shields = units.filter(u => u.role === 'Shield' || u.role === 'Infantry').slice(0, 6);
  if (!engineer || shields.length < 2) return null;

  const formation = shields.length > 4 ? 'Box' : shields.length > 2 ? 'Wedge' : 'Line';
  const shieldAngle = calcShieldAngle(formation);
  return {
    engineer: engineer.id,
    escorts: shields.map((u: any) => u.id),
    shieldAngle,
    formation,
    ready: false,
  };
}

export function tickEscortV2(form: EscortFormation, state: EscortStateContext): EscortFormation {
  const engineer = state.unitById?.[form.engineer];
  if (!engineer?.pos) return form;
  const guards = form.escorts
    .map(id => state.unitById?.[id])
    .filter(Boolean);

  guards.forEach((guard: any, idx: number) => {
    const offset = getOffset(idx, guards.length, form.formation, form.shieldAngle);
    const target = offsetPos(engineer.pos, offset);
    moveToward(guard, target, state);
  });

  form.ready = guards.every((guard: any) => guard?.pos && hexDist(guard.pos, engineer.pos) <= 1);
  return form;
}

function calcShieldAngle(form: EscortFormation['formation']): number {
  if (form === 'Line') return 180;
  if (form === 'Wedge') return 90;
  return 45;
}

function getOffset(idx: number, count: number, form: EscortFormation['formation'], angle: number): Hex {
  if (form === 'Box') {
    const row = Math.floor(idx / 2) - 1;
    const col = (idx % 2) * 2 - 1;
    return { q: col, r: row };
  }
  if (form === 'Wedge') {
    const side = idx % 2 === 0 ? -1 : 1;
    const depth = Math.floor(idx / 2);
    return rotateOffset({ q: side, r: depth }, angle);
  }
  const offset = idx - Math.floor(count / 2);
  return rotateOffset({ q: offset, r: 0 }, angle);
}

function rotateOffset(offset: Hex, angle: number): Hex {
  // Simplified rotation: treat axes as is, scale with angle factor
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const x = offset.q * cos - offset.r * sin;
  const y = offset.q * sin + offset.r * cos;
  return { q: Math.round(x), r: Math.round(y) };
}

function offsetPos(base: Hex, offset: Hex): Hex {
  return { q: base.q + offset.q, r: base.r + offset.r };
}

function moveToward(unit: any, target: Hex, _state: EscortStateContext): void {
  if (!unit) return;
  unit.intent = unit.intent ?? {};
  unit.intent.escort = { target };
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
