// packages/core/src/unit/types.ts
import type { Axial } from '../action/types';

export type School = 'Fire' | 'Water' | 'Air' | 'Earth' | 'Mind' | 'Body' | 'Spirit' | 'Light' | 'Dark';
export type DamageKind = 'Physical' | 'Magical';

export interface Stats {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    spd: number;
    lck: number;
}

export interface Resist {
    [K: string]: number; // percentage −100..+100; keys use School names
}

export interface Derived {
    hpMax: number;
    mpMax: number;
    apMax: number;
    atk: number;  // base physical power from STR
    mag: number;  // base magical power from INT
    def: number;  // armor/soak from CON+gear
    res: number;  // magical defense from WIS+gear
    acc: number;  // accuracy from DEX
    eva: number;  // evasion from DEX/SPD
    crit: number; // crit chance permille (‰)
    cpd: number;  // crit dmg percent (e.g., 50 => +50%)
}

export interface EquipmentMod {
    stats?: Partial<Stats>;
    derived?: Partial<Derived>;
    resist?: Partial<Resist>;
    armor?: number;   // flat to def
    power?: number;   // flat to atk/mag depending on kind
    tags?: string[];  // e.g., 'sword','bow','cloth','plate'
}

export interface Item {
    id: string;
    name: string;
    slot: 'weapon' | 'armor' | 'accessory';
    kind: 'melee' | 'ranged' | 'wand' | 'talisman';
    mod: EquipmentMod;
}

export interface EquipmentSlots {
    weapon?: Item;
    armor?: Item;
    accessory?: Item;
}

export interface StatusInst {
    name: string;
    turns: number;
    amount?: number;
    stacks?: number;
    data?: any;
}

export interface Unit {
    id: string;
    name: string;
    team: string;
    level: number;
    pos: Axial;
    base: Stats;                    // unmodified
    equips: EquipmentSlots;
    resist: Partial<Resist>;        // per School, −100..+100; 25 means 25% reduction
    hp: number;
    mp: number;
    ap: number;
    statuses: StatusInst[];
}

export interface HitContext {
    rng: () => number;                                 // deterministic RNG
    defenseBonusAt: (_h: Axial) => number;               // from #05 Terrain (percent)
    damageSchool?: School;                           // for magical damage
    damageKind: DamageKind;                          // Physical or Magical
    sourceTags?: string[];                           // weapon/spell tags for status hooks
}

export interface DamageIn {
    power: number;           // ability/weapon power scalar
    multiplier: number;      // ability multiplier in percent (e.g., 120 = 1.2x)
    armorPen?: number;       // flat armor penetration before def (≥0)
    resistPen?: number;      // percentage points to ignore on school resist (≥0)
    canCrit?: boolean;       // allow crit roll
    guaranteedHit?: boolean; // skip hit check (e.g., certain spells)
}

export interface DamageOut {
    hit: boolean;
    crit: boolean;
    rolled?: {
        hit: number;
        need: number;
        crit: number;
        needCrit: number;
    };
    raw: number;
    mitigated: number;
    final: number;
}
