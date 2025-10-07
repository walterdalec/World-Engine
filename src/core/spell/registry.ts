// packages/core/src/spell/registry.ts
import type { Spell } from './types';

export const DEFAULT_LEVEL_GATES: Record<1 | 2 | 3 | 4, number> = { 1: 1, 2: 4, 3: 7, 4: 10 };

function normalizeSpells<T extends Record<string, Spell>>(book: T): T {
    for (const s of Object.values(book)) {
        s.exclusiveTo = s.exclusiveTo ?? 'any';
        s.requires = s.requires ?? {};
        if (s.requires.minUnitLevel == null) s.requires.minUnitLevel = DEFAULT_LEVEL_GATES[s.level];
        if (s.level === 4 && !s.reagents) s.reagents = ['rare_reagent'];
    }
    return book;
}

const BaseSpells: Record<string, Spell> = {
    // BODY
    'body.mend': {
        id: 'body.mend',
        name: 'Mend',
        school: 'Body',
        level: 1,
        manaCost: 4,
        apCost: 3,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'heal', amount: 12 }],
        tags: ['healing']
    },
    'body.detoxify': {
        id: 'body.detoxify',
        name: 'Detoxify',
        school: 'Body',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'debuff', name: 'cleanse', turns: 0 }],
        tags: ['cleanse']
    },
    'body.regenerate': {
        id: 'body.regenerate',
        name: 'Regenerate',
        school: 'Body',
        level: 2,
        manaCost: 7,
        apCost: 3,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'hot', name: 'regeneration', amount: 3, turns: 3 }],
        tags: ['healing']
    },
    'body.bulwark': {
        id: 'body.bulwark',
        name: 'Bulwark',
        school: 'Body',
        level: 3,
        manaCost: 10,
        apCost: 4,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'buff', name: 'bulwark', turns: 3 }],
        tags: ['protection']
    },

    // FIRE
    'fire.ember_dart': {
        id: 'fire.ember_dart',
        name: 'Ember Dart',
        school: 'Fire',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 6,
        aoe: 'single',
        effects: [
            { kind: 'damage', damageKind: 'Magical', school: 'Fire', power: 6, multiplier: 100 },
            { kind: 'dot', name: 'burn', amount: 1, turns: 2, school: 'Fire' }
        ],
        tags: ['damage']
    },
    'fire.bolt': {
        id: 'fire.bolt',
        name: 'Firebolt',
        school: 'Fire',
        level: 1,
        manaCost: 5,
        apCost: 3,
        range: 6,
        aoe: 'single',
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Fire', power: 8, multiplier: 120 }],
        tags: ['damage']
    },
    'fire.flame_cone': {
        id: 'fire.flame_cone',
        name: 'Flame Cone',
        school: 'Fire',
        level: 2,
        manaCost: 8,
        apCost: 4,
        range: 4,
        aoe: 'cone',
        width: 3,
        effects: [
            { kind: 'damage', damageKind: 'Magical', school: 'Fire', power: 6, multiplier: 110 },
            { kind: 'dot', name: 'burn', amount: 2, turns: 2, school: 'Fire' }
        ],
        tags: ['aoe', 'dot']
    },
    'fire.inferno_burst': {
        id: 'fire.inferno_burst',
        name: 'Inferno Burst',
        school: 'Fire',
        level: 3,
        manaCost: 11,
        apCost: 5,
        range: 6,
        aoe: 'blast',
        width: 2,
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Fire', power: 10, multiplier: 120 }],
        tags: ['aoe']
    },

    // WATER
    'water.ice_shard': {
        id: 'water.ice_shard',
        name: 'Ice Shard',
        school: 'Water',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 6,
        aoe: 'single',
        effects: [
            { kind: 'damage', damageKind: 'Magical', school: 'Water', power: 5, multiplier: 100 },
            { kind: 'debuff', name: 'slowed', turns: 1 }
        ],
        tags: ['control']
    },
    'water.mist_cloud': {
        id: 'water.mist_cloud',
        name: 'Mist Cloud',
        school: 'Water',
        level: 1,
        manaCost: 5,
        apCost: 3,
        range: 5,
        aoe: 'blast',
        width: 1,
        effects: [{ kind: 'debuff', name: 'obscured', turns: 1 }],
        tags: ['control', 'los']
    },
    'water.frost_lance': {
        id: 'water.frost_lance',
        name: 'Frost Lance',
        school: 'Water',
        level: 2,
        manaCost: 7,
        apCost: 3,
        range: 6,
        aoe: 'line',
        width: 4,
        effects: [
            { kind: 'damage', damageKind: 'Magical', school: 'Water', power: 7, multiplier: 100 },
            { kind: 'debuff', name: 'rooted', turns: 1 }
        ],
        tags: ['line', 'root']
    },
    'water.healing_rain': {
        id: 'water.healing_rain',
        name: 'Healing Rain',
        school: 'Water',
        level: 3,
        manaCost: 10,
        apCost: 4,
        range: 5,
        aoe: 'blast',
        width: 1,
        effects: [{ kind: 'hot', name: 'regeneration', amount: 3, turns: 3 }],
        tags: ['healing', 'aoe']
    },

    // AIR
    'air.static_jolt': {
        id: 'air.static_jolt',
        name: 'Static Jolt',
        school: 'Air',
        level: 1,
        manaCost: 3,
        apCost: 2,
        range: 6,
        aoe: 'single',
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Air', power: 5, multiplier: 100 }],
        tags: ['damage']
    },
    'air.haste': {
        id: 'air.haste',
        name: 'Haste',
        school: 'Air',
        level: 2,
        manaCost: 6,
        apCost: 3,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'buff', name: 'haste', turns: 1 }],
        tags: ['initiative']
    },
    'air.wind_wall': {
        id: 'air.wind_wall',
        name: 'Wind Wall',
        school: 'Air',
        level: 2,
        manaCost: 8,
        apCost: 4,
        range: 5,
        aoe: 'line',
        width: 3,
        effects: [{ kind: 'terrain', change: 'create', tile: 'wall', duration: 2 }],
        tags: ['terrain', 'projectile']
    },
    'air.chain_spark': {
        id: 'air.chain_spark',
        name: 'Chain Spark',
        school: 'Air',
        level: 3,
        manaCost: 9,
        apCost: 4,
        range: 5,
        aoe: 'single',
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Air', power: 7, multiplier: 100 }],
        tags: ['multitarget']
    },

    // EARTH
    'earth.stone_spikes': {
        id: 'earth.stone_spikes',
        name: 'Stone Spikes',
        school: 'Earth',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 4,
        aoe: 'line',
        width: 3,
        effects: [{ kind: 'terrain', change: 'create', tile: 'fortress', duration: 2 }],
        tags: ['hazard']
    },
    'earth.barkskin': {
        id: 'earth.barkskin',
        name: 'Barkskin',
        school: 'Earth',
        level: 1,
        manaCost: 5,
        apCost: 2,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'buff', name: 'barkskin', turns: 2 }],
        tags: ['defense']
    },
    'earth.stone_wall': {
        id: 'earth.stone_wall',
        name: 'Stone Wall',
        school: 'Earth',
        level: 2,
        manaCost: 8,
        apCost: 4,
        range: 5,
        aoe: 'line',
        width: 3,
        effects: [{ kind: 'terrain', change: 'create', tile: 'wall', duration: 3 }],
        tags: ['terrain']
    },
    'earth.quake': {
        id: 'earth.quake',
        name: 'Quake',
        school: 'Earth',
        level: 3,
        manaCost: 12,
        apCost: 5,
        range: 6,
        aoe: 'blast',
        width: 2,
        effects: [
            { kind: 'damage', damageKind: 'Magical', school: 'Earth', power: 10, multiplier: 110 },
            { kind: 'debuff', name: 'knockdown', turns: 1 }
        ],
        tags: ['aoe']
    },

    // MIND
    'mind.daze': {
        id: 'mind.daze',
        name: 'Daze',
        school: 'Mind',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 6,
        aoe: 'single',
        effects: [{ kind: 'debuff', name: 'skip', turns: 1 }],
        tags: ['control']
    },
    'mind.silence': {
        id: 'mind.silence',
        name: 'Silence',
        school: 'Mind',
        level: 2,
        manaCost: 7,
        apCost: 3,
        range: 6,
        aoe: 'single',
        effects: [{ kind: 'debuff', name: 'silenced', turns: 2 }],
        tags: ['anti-mage']
    },
    'mind.sleep': {
        id: 'mind.sleep',
        name: 'Sleep',
        school: 'Mind',
        level: 2,
        manaCost: 7,
        apCost: 3,
        range: 6,
        aoe: 'single',
        effects: [{ kind: 'debuff', name: 'sleep', turns: 2 }],
        tags: ['control']
    },
    'mind.psychic_lance': {
        id: 'mind.psychic_lance',
        name: 'Psychic Lance',
        school: 'Mind',
        level: 3,
        manaCost: 9,
        apCost: 4,
        range: 5,
        aoe: 'single',
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Mind', power: 9, multiplier: 110, armorPen: 9999 }],
        tags: ['pierce']
    },

    // SPIRIT
    'spirit.bless': {
        id: 'spirit.bless',
        name: 'Bless',
        school: 'Spirit',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'buff', name: 'bless', turns: 2 }],
        tags: ['accuracy']
    },
    'spirit.ward_fire': {
        id: 'spirit.ward_fire',
        name: 'Ward: Fire',
        school: 'Spirit',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'buff', name: 'ward_fire', turns: 3 }],
        tags: ['resist']
    },
    'spirit.sanctuary': {
        id: 'spirit.sanctuary',
        name: 'Sanctuary',
        school: 'Spirit',
        level: 2,
        manaCost: 8,
        apCost: 3,
        range: 0,
        aoe: 'blast',
        width: 0,
        effects: [{ kind: 'buff', name: 'sanctuary', turns: 1 }],
        tags: ['protection']
    },
    'spirit.rebuke': {
        id: 'spirit.rebuke',
        name: 'Rebuke',
        school: 'Spirit',
        level: 3,
        manaCost: 9,
        apCost: 4,
        range: 6,
        aoe: 'single',
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Spirit', power: 9, multiplier: 110 }],
        tags: ['anti-undead']
    },

    // LIGHT
    'light.sunray': {
        id: 'light.sunray',
        name: 'Sunray',
        school: 'Light',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 6,
        aoe: 'single',
        effects: [
            { kind: 'damage', damageKind: 'Magical', school: 'Light', power: 6, multiplier: 100 },
            { kind: 'debuff', name: 'blinded', turns: 1 }
        ],
        tags: ['blind']
    },
    'light.cleanse': {
        id: 'light.cleanse',
        name: 'Cleanse',
        school: 'Light',
        level: 1,
        manaCost: 3,
        apCost: 2,
        range: 4,
        aoe: 'single',
        effects: [{ kind: 'debuff', name: 'cleanse', turns: 0 }],
        tags: ['cleanse']
    },
    'light.radiant_shield': {
        id: 'light.radiant_shield',
        name: 'Radiant Shield',
        school: 'Light',
        level: 2,
        manaCost: 8,
        apCost: 4,
        range: 0,
        aoe: 'blast',
        width: 1,
        effects: [{ kind: 'buff', name: 'reflect', turns: 2 }],
        tags: ['reflect']
    },
    'light.sunburst': {
        id: 'light.sunburst',
        name: 'Sunburst',
        school: 'Light',
        level: 4,
        manaCost: 14,
        apCost: 5,
        range: 6,
        aoe: 'blast',
        width: 2,
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Light', power: 12, multiplier: 120 }],
        tags: ['aoe']
    },

    // DARK
    'dark.shadow_bolt': {
        id: 'dark.shadow_bolt',
        name: 'Shadow Bolt',
        school: 'Dark',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 6,
        aoe: 'single',
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Dark', power: 6, multiplier: 100 }],
        tags: ['damage']
    },
    'dark.hex': {
        id: 'dark.hex',
        name: 'Hex',
        school: 'Dark',
        level: 1,
        manaCost: 4,
        apCost: 2,
        range: 6,
        aoe: 'single',
        effects: [{ kind: 'debuff', name: 'hexed', turns: 2 }],
        tags: ['curse']
    },
    'dark.drain_life': {
        id: 'dark.drain_life',
        name: 'Drain Life',
        school: 'Dark',
        level: 2,
        manaCost: 8,
        apCost: 3,
        range: 5,
        aoe: 'single',
        effects: [
            { kind: 'damage', damageKind: 'Magical', school: 'Dark', power: 7, multiplier: 100 },
            { kind: 'heal', amount: 5 }
        ],
        tags: ['leech']
    },
    'dark.necrotic_cloud': {
        id: 'dark.necrotic_cloud',
        name: 'Necrotic Cloud',
        school: 'Dark',
        level: 3,
        manaCost: 11,
        apCost: 4,
        range: 5,
        aoe: 'blast',
        width: 1,
        effects: [
            { kind: 'damage', damageKind: 'Magical', school: 'Dark', power: 8, multiplier: 100 },
            { kind: 'dot', name: 'poison', amount: 2, turns: 3 }
        ],
        tags: ['aoe', 'dot']
    },

    // HERO-ONLY
    'hero.light.miracle': {
        id: 'hero.light.miracle',
        name: 'Miracle',
        school: 'Light',
        level: 4,
        manaCost: 16,
        apCost: 6,
        range: 0,
        aoe: 'blast',
        width: 1,
        reagents: ['saint_amber'],
        exclusiveTo: 'hero',
        effects: [
            { kind: 'heal', amount: 18 },
            { kind: 'debuff', name: 'cleanse', turns: 0 }
        ],
        tags: ['hero', 'healing', 'cleanse']
    },
    'hero.fire.worldfire': {
        id: 'hero.fire.worldfire',
        name: 'Worldfire',
        school: 'Fire',
        level: 4,
        manaCost: 18,
        apCost: 6,
        range: 7,
        aoe: 'blast',
        width: 3,
        reagents: ['brimstone', 'brimstone'],
        exclusiveTo: 'hero',
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Fire', power: 16, multiplier: 120 }],
        tags: ['hero', 'aoe']
    },
    'hero.mind.timeshift': {
        id: 'hero.mind.timeshift',
        name: 'Timeshift',
        school: 'Mind',
        level: 4,
        manaCost: 12,
        apCost: 4,
        castTime: 0,
        range: 0,
        aoe: 'single',
        exclusiveTo: 'hero',
        effects: [{ kind: 'buff', name: 'extra_action', turns: 1 }],
        tags: ['hero', 'initiative']
    },
    'hero.spirit.banner_valor': {
        id: 'hero.spirit.banner_valor',
        name: 'Banner of Valor',
        school: 'Spirit',
        level: 3,
        manaCost: 10,
        apCost: 4,
        range: 0,
        aoe: 'blast',
        width: 1,
        exclusiveTo: 'hero',
        effects: [{ kind: 'buff', name: 'valor', turns: 3 }],
        tags: ['hero', 'party-buff']
    },
    'hero.earth.dome': {
        id: 'hero.earth.dome',
        name: 'Bulwark Dome',
        school: 'Earth',
        level: 3,
        manaCost: 12,
        apCost: 5,
        range: 0,
        aoe: 'blast',
        width: 1,
        exclusiveTo: 'hero',
        effects: [{ kind: 'terrain', change: 'create', tile: 'wall', duration: 2 }],
        tags: ['hero', 'terrain']
    },
    'hero.air.sky_strider': {
        id: 'hero.air.sky_strider',
        name: 'Sky Strider',
        school: 'Air',
        level: 3,
        manaCost: 9,
        apCost: 4,
        range: 6,
        aoe: 'line',
        width: 3,
        exclusiveTo: 'hero',
        effects: [{ kind: 'buff', name: 'blink_strike', turns: 1 }],
        tags: ['hero', 'mobility', 'blink']
    },
    'hero.water.tidebinder': {
        id: 'hero.water.tidebinder',
        name: 'Tidebinder',
        school: 'Water',
        level: 3,
        manaCost: 11,
        apCost: 4,
        range: 6,
        aoe: 'blast',
        width: 1,
        exclusiveTo: 'hero',
        effects: [
            { kind: 'debuff', name: 'pulled', turns: 1 },
            { kind: 'debuff', name: 'rooted', turns: 1 }
        ],
        tags: ['hero', 'control']
    },
    'hero.dark.oath_twilight': {
        id: 'hero.dark.oath_twilight',
        name: 'Oath of Twilight',
        school: 'Dark',
        level: 4,
        manaCost: 14,
        apCost: 5,
        range: 0,
        aoe: 'blast',
        width: 1,
        exclusiveTo: 'hero',
        effects: [{ kind: 'buff', name: 'twilight_vow', turns: 2 }],
        tags: ['hero', 'damage-share']
    },
    'hero.body.heroic_resolve': {
        id: 'hero.body.heroic_resolve',
        name: 'Heroic Resolve',
        school: 'Body',
        level: 2,
        manaCost: 7,
        apCost: 3,
        range: 0,
        aoe: 'blast',
        width: 0,
        exclusiveTo: 'hero',
        effects: [
            { kind: 'buff', name: 'resolve', turns: 2 },
            { kind: 'debuff', name: 'cleanse', turns: 0 }
        ],
        tags: ['hero', 'cleanse', 'shield']
    },
    'hero.light.judgment': {
        id: 'hero.light.judgment',
        name: 'Judgment',
        school: 'Light',
        level: 4,
        manaCost: 14,
        apCost: 5,
        range: 6,
        aoe: 'single',
        exclusiveTo: 'hero',
        effects: [{ kind: 'damage', damageKind: 'Magical', school: 'Light', power: 14, multiplier: 120 }],
        tags: ['hero', 'execute']
    },

    // COMMANDER-ONLY AURAS
    'commander.spirit.war_banner': {
        id: 'commander.spirit.war_banner',
        name: 'War Banner',
        school: 'Spirit',
        level: 2,
        manaCost: 6,
        apCost: 3,
        range: 0,
        aoe: 'blast',
        width: 1,
        exclusiveTo: 'commander',
        effects: [{ kind: 'buff', name: 'valor', turns: 2 }],
        tags: ['aura', 'commander', 'party-buff']
    },
    'commander.mind.tactical_focus': {
        id: 'commander.mind.tactical_focus',
        name: 'Tactical Focus',
        school: 'Mind',
        level: 2,
        manaCost: 6,
        apCost: 3,
        range: 0,
        aoe: 'blast',
        width: 1,
        exclusiveTo: 'commander',
        effects: [{ kind: 'buff', name: 'focus', turns: 2 }],
        tags: ['aura', 'commander', 'accuracy']
    },
    'commander.earth.stalwart_line': {
        id: 'commander.earth.stalwart_line',
        name: 'Stalwart Line',
        school: 'Earth',
        level: 3,
        manaCost: 8,
        apCost: 4,
        range: 0,
        aoe: 'blast',
        width: 1,
        exclusiveTo: 'commander',
        effects: [{ kind: 'buff', name: 'guarded', turns: 2 }],
        tags: ['aura', 'commander', 'defense']
    },
    'commander.light.holy_aegis': {
        id: 'commander.light.holy_aegis',
        name: 'Holy Aegis',
        school: 'Light',
        level: 3,
        manaCost: 9,
        apCost: 4,
        range: 0,
        aoe: 'blast',
        width: 1,
        exclusiveTo: 'commander',
        effects: [{ kind: 'buff', name: 'ward_all', turns: 2 }],
        tags: ['aura', 'commander', 'resist']
    }
};

export const Spells = normalizeSpells(BaseSpells);

/**
 * Get spell by ID
 */
export function getSpellById(id: string): Spell | undefined {
    return Spells[id];
}

/**
 * Get all spells for a school
 */
export function getSpellsBySchool(school: string): Spell[] {
    return Object.values(Spells).filter(spell => spell.school === school);
}

/**
 * Get all spells up to a certain level
 */
export function getSpellsByLevel(maxLevel: number): Spell[] {
    return Object.values(Spells).filter(spell => spell.level <= maxLevel);
}