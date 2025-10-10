// packages/core/src/unit/damage.ts
import type { Axial as _Axial } from '../action/types';
import { Balance as B } from './balance';
import type { Unit as _Unit, DamageIn, DamageOut, HitContext, Derived, EquipmentSlots, Stats } from './types';
import { gatherEquipMods } from './equipment';
import { computeDerived } from './derived';

function clampPct(x: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, x));
}

// ---- Lightweight compatibility helpers (so #04/#07A can pass minimal units) ----
const DEFAULT_BASE: Stats = { str: 5, dex: 5, con: 5, int: 5, wis: 5, cha: 5, spd: 5, lck: 5 };

function safeBase(b?: Stats): Stats {
    return b ? ({ ...DEFAULT_BASE, ...b }) : { ...DEFAULT_BASE };
}

function safeEquips(e?: EquipmentSlots): EquipmentSlots {
    return (e || {}) as EquipmentSlots;
}

function safePos(p: any) {
    return p || { q: 0, r: 0 };
}

export interface HitRollOut {
    hit: boolean;
    need: number;
    roll: number;
}

export function rollToHit(att: Derived, def: Derived, rng: () => number): HitRollOut {
    const acc = att.acc;
    const eva = def.eva;
    const hitPct = clampPct(50 + (acc - eva), B.hitFloorPct, B.hitCeilPct); // linear for now
    const roll = Math.floor(rng() * 100) + 1; // 1..100
    return { hit: roll <= hitPct, need: hitPct, roll };
}

export function rollCrit(critPermille: number, rng: () => number) {
    const need = Math.max(0, Math.min(1000, critPermille));
    const roll = Math.floor(rng() * 1000); // 0..999
    return { crit: roll < need, need, roll };
}

export function computeDamage(attacker: any, defender: any, input: DamageIn, ctx: HitContext): DamageOut {
    // Tolerate lightweight world units (no base/equips/resist)
    const Aeq = gatherEquipMods(safeEquips(attacker.equips));
    const Deq = gatherEquipMods(safeEquips(defender.equips));
    const A = computeDerived(safeBase(attacker.base), Aeq.stats, Aeq.armor, Aeq.power);
    const D = computeDerived(safeBase(defender.base), Deq.stats, Deq.armor, Deq.power);

    // 1) Hit check (unless guaranteed)
    const hitRoll = input.guaranteedHit ? { hit: true, need: 100, roll: 0 } : rollToHit(A, D, ctx.rng);
    if (!hitRoll.hit) {
        return {
            hit: false,
            crit: false,
            raw: 0,
            mitigated: 0,
            final: 0,
            rolled: {
                hit: hitRoll.roll,
                need: hitRoll.need,
                crit: 0,
                needCrit: 0
            }
        };
    }

    // 2) Base power (percent multiplier applied later)
    const basePower = ctx.damageKind === 'Physical' ? A.atk + (input.power | 0) : A.mag + (input.power | 0);
    let raw = Math.max(0, basePower | 0);

    // 3) Flat mitigation by armor/res (armorPen used for both as simple model)
    const pen = Math.max(0, input.armorPen || 0);
    const soak = ctx.damageKind === 'Physical' ? Math.max(0, D.def - pen) : Math.max(0, D.res - pen);
    let mitigated = Math.max(0, raw - soak);

    // 4) Ability multiplier (percent)
    const mult = Math.max(1, input.multiplier | 0);
    mitigated = Math.floor(mitigated * (mult / 100));

    // 5) Elemental resist (if any)
    if (ctx.damageKind === 'Magical' && ctx.damageSchool) {
        const r0 = (defender.resist && typeof defender.resist[ctx.damageSchool] === 'number') ? defender.resist[ctx.damageSchool] : 0;
        const r = (r0 | 0) - Math.max(0, input.resistPen || 0);
        const factor = Math.max(0, 1 - r / 100);
        mitigated = Math.floor(mitigated * factor);
    }

    // 6) Set final damage before terrain/status adjustments
    let final = mitigated;

    // 7) Terrain defense bonus (percent reduction)
    const terr = Math.max(0, Math.min(100, ctx.defenseBonusAt(safePos(defender.pos)) | 0));
    final = Math.floor(final * (1 - terr / 100));

    // 8) Status hooks could adjust here via resolver (left to #04). Keep final as mutable.

    // 9) Crit
    let critRes = { crit: false, need: 0, roll: 0 };
    if (input.canCrit) {
        critRes = rollCrit(A.crit, ctx.rng);
        if (critRes.crit) {
            final = Math.floor(final * (100 + A.cpd) / 100);
        }
    }

    return {
        hit: true,
        crit: critRes.crit,
        raw,
        mitigated,
        final,
        rolled: {
            hit: hitRoll.roll,
            need: hitRoll.need,
            crit: critRes.roll,
            needCrit: critRes.need
        }
    };
}