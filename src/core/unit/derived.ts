// packages/core/src/unit/derived.ts
import { Balance as B } from './balance';
import type { Stats, Derived } from './types';

export function computeDerived(base: Stats, equip: Partial<Stats> = {}, gearArmor = 0, gearPower = 0): Derived {
    const s = sumStats(base, equip);
    const def = Math.floor(s.con * B.defPerCON + gearArmor);
    const res = Math.floor(s.wis * B.resPerWIS);
    return {
        hpMax: s.con * B.hpPerCON,
        mpMax: s.wis * B.mpPerWIS,
        apMax: B.apBase,
        atk: s.str * B.atkPerSTR + gearPower,
        mag: s.int * B.magPerINT + gearPower,
        def, res,
        acc: s.dex * B.accPerDEX,
        eva: s.dex * B.evaPerDEX + s.spd * B.evaPerSPD,
        crit: B.critBasePermille + s.lck * B.critPerLCKPermille,
        cpd: B.critDamagePct,
    };
}

export function sumStats(a: Stats, b: Partial<Stats>): Stats {
    return {
        str: a.str + (b.str || 0),
        dex: a.dex + (b.dex || 0),
        con: a.con + (b.con || 0),
        int: a.int + (b.int || 0),
        wis: a.wis + (b.wis || 0),
        cha: a.cha + (b.cha || 0),
        spd: a.spd + (b.spd || 0),
        lck: a.lck + (b.lck || 0)
    };
}