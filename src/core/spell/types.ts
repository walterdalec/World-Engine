// packages/core/src/spell/types.ts
import type { Axial } from '../action/types';
import type { School, DamageKind } from '../unit/types';

export type SpellLevel = 1 | 2 | 3 | 4; // Basic, Expert, Master, Grandmaster
export type MasteryLevel = 1 | 2 | 3 | 4; // caster's mastery in a school
export type AOE = 'single' | 'line' | 'cone' | 'blast';

export type TerrainTile = 'fire' | 'wall' | 'fortress' | 'scorched';

export interface SpellEffectDamage {
    kind: 'damage';
    damageKind: DamageKind;
    school?: School;
    power: number;
    multiplier: number;
    canCrit?: boolean;
    resistPen?: number;
    armorPen?: number;
}

export interface SpellEffectHeal {
    kind: 'heal';
    amount: number;
}

export interface SpellEffectBuff {
    kind: 'buff';
    name: string;
    turns: number;
}

export interface SpellEffectDebuff {
    kind: 'debuff';
    name: string;
    turns: number;
}

export interface SpellEffectDoT {
    kind: 'dot';
    name: 'burn' | 'poison' | string;
    amount: number;
    turns: number;
    school?: School;
}

export interface SpellEffectHoT {
    kind: 'hot';
    name: 'regeneration' | string;
    amount: number;
    turns: number;
}

export interface SpellEffectTerrain {
    kind: 'terrain';
    change: 'create' | 'destroy';
    tile: TerrainTile;
    duration?: number;
}

export type SpellEffect = SpellEffectDamage | SpellEffectHeal | SpellEffectBuff | SpellEffectDebuff | SpellEffectDoT | SpellEffectHoT | SpellEffectTerrain;

export interface SpellRequirements {
    minUnitLevel?: number;
    minMastery?: MasteryLevel;
    questFlag?: string;
    research?: string;
}

export interface Spell {
    id: string;
    name: string;
    school: School;
    level: SpellLevel;
    manaCost: number;
    apCost: number;
    castTime?: number;
    range: number;
    aoe: AOE;
    width?: number;
    reagents?: string[];
    effects: SpellEffect[];
    exclusiveTo?: 'any' | 'hero' | 'commander';
    tags?: string[];
    requires?: SpellRequirements;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    needsLOS?: boolean; // default true. If false, target point does not require line of sight.
}

export interface CastContext {
    origin: Axial;
    aimed: Axial;
    targetHexes: Axial[];
    casterId: string;
    spell: Spell;
}
