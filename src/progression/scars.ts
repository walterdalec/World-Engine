/**
 * Canvas 11 - Scars & Wounds System
 * 
 * Lasting consequences from injuries and revival
 * Scars provide drawbacks with situational upsides
 */

import type { Wound, Scar, ProgressionEvent } from './types';
import type { CharacterId } from '../party/types';
import { SCAR_LIMITS } from './types';
import { SeededRandom } from '../proc/noise';

/**
 * Scar registry - predefined scars with mods
 */
const SCAR_REGISTRY: Omit<Scar, 'acquiredDay' | 'id'>[] = [
    // Crushing damage scars
    {
        name: 'Shattered Hand',
        description: 'Bones never quite healed right',
        mods: [
            { stat: 'DEX', amount: -2 },
            { type: 'ranged_accuracy', percent: -10 },
            { type: 'crafting_speed', percent: -20 }
        ],
        visible: true,
        source: 'injury'
    },
    {
        name: 'Broken Ribs',
        description: 'Breathing is painful',
        mods: [
            { stat: 'CON', amount: -1 },
            { type: 'stamina_regen', percent: -15 },
            { type: 'carrying_capacity', percent: -10 }
        ],
        visible: false,
        source: 'injury'
    },

    // Piercing/slashing scars
    {
        name: 'Deep Scar',
        description: 'A vivid reminder of near-death',
        mods: [
            { type: 'intimidation', percent: 10 },
            { stat: 'CHA', amount: -1 }
        ],
        visible: true,
        source: 'injury'
    },
    {
        name: 'Arterial Damage',
        description: 'Blood flow never recovered',
        mods: [
            { type: 'max_hp', percent: -5 },
            { type: 'bleed_resistance', percent: -20 }
        ],
        visible: false,
        source: 'injury'
    },

    // Fire scars
    {
        name: 'Smoke-Scorched Lungs',
        description: 'Breathing is labored',
        mods: [
            { stat: 'CON', amount: -1 },
            { type: 'stamina_regen', percent: -15 },
            { type: 'fire_resistance', percent: 10 }
        ],
        visible: false,
        source: 'injury'
    },
    {
        name: 'Burn Scars',
        description: 'Twisted skin tells a story',
        mods: [
            { stat: 'CHA', amount: -2 },
            { type: 'fire_resistance', percent: 15 },
            { type: 'fear_aura', amount: 5 }
        ],
        visible: true,
        source: 'injury'
    },

    // Frost scars
    {
        name: 'Frostbitten Extremities',
        description: 'Fingers and toes never warmed up',
        mods: [
            { stat: 'DEX', amount: -1 },
            { type: 'frost_resistance', percent: 15 },
            { type: 'cold_weather_penalty', percent: -20 }
        ],
        visible: true,
        source: 'injury'
    },

    // Poison/necrotic scars
    {
        name: 'Withered Flesh',
        description: 'Necrotic damage left its mark',
        mods: [
            { stat: 'CON', amount: -2 },
            { type: 'poison_resistance', percent: 20 },
            { type: 'healing_received', percent: -10 }
        ],
        visible: true,
        source: 'injury'
    },
    {
        name: 'Corrupted Blood',
        description: 'Toxins linger in your veins',
        mods: [
            { type: 'max_hp', percent: -10 },
            { type: 'poison_resistance', percent: 25 },
            { stat: 'STR', amount: -1 }
        ],
        visible: false,
        source: 'injury'
    },

    // Revival scars
    {
        name: 'Death\'s Touch',
        description: 'You bear the mark of the underworld',
        mods: [
            { type: 'max_hp', percent: -5 },
            { type: 'necrotic_resistance', percent: 20 },
            { type: 'undead_detection', percent: 50 }
        ],
        visible: true,
        locked: true,
        source: 'revival'
    },
    {
        name: 'Soul Fracture',
        description: 'Part of you remains beyond',
        mods: [
            { stat: 'WIS', amount: -1 },
            { type: 'magic_resistance', percent: 10 },
            { type: 'spirit_sight', amount: 1 }
        ],
        visible: false,
        locked: true,
        source: 'revival'
    },

    // Psychic/special scars
    {
        name: 'Witch-Sight',
        description: 'You see things others cannot',
        mods: [
            { type: 'detect_illusions', percent: 15 },
            { stat: 'CHA', amount: -1 },
            { type: 'hallucination_chance', percent: 5 }
        ],
        visible: false,
        source: 'injury'
    },
    {
        name: 'Iron Stitching',
        description: 'Crude surgery saved your life',
        mods: [
            { type: 'max_hp', percent: 10 },
            { type: 'initiative', percent: -10 },
            { type: 'fear_aura', amount: 5 }
        ],
        visible: true,
        source: 'injury'
    }
];

/**
 * Roll for scar from wound
 */
export function rollScarFromWound(
    wound: Wound,
    seed: string,
    memberId: CharacterId
): Scar | null {
    const rng = new SeededRandom(`${seed}_scar_${memberId}_${wound.day}`);

    // Check if scar should be applied
    let shouldScar = false;
    if (wound.kind === 'minor') {
        shouldScar = rng.nextFloat() < SCAR_LIMITS.MINOR_INJURY_CHANCE;
    } else if (wound.kind === 'major') {
        shouldScar = SCAR_LIMITS.MAJOR_INJURY_CHANCE >= 1.0 || rng.nextFloat() < SCAR_LIMITS.MAJOR_INJURY_CHANCE;
    } else {
        // Fatal wounds don't scar (they kill)
        return null;
    }

    if (!shouldScar) return null;

    // Filter scars by damage tags
    const relevantScars = SCAR_REGISTRY.filter(scar => {
        if (scar.source !== 'injury') return false;

        // Match scar to damage tags
        const scarName = scar.name.toLowerCase();
        return wound.tags.some(tag => {
            const tagLower = tag.toLowerCase();
            return scarName.includes(tagLower) ||
                (tag === 'crushing' && scarName.includes('shatter')) ||
                (tag === 'crushing' && scarName.includes('broken')) ||
                (tag === 'piercing' && scarName.includes('arterial')) ||
                (tag === 'slashing' && scarName.includes('scar')) ||
                (tag === 'fire' && scarName.includes('burn')) ||
                (tag === 'fire' && scarName.includes('scorch')) ||
                (tag === 'frost' && scarName.includes('frost')) ||
                (tag === 'poison' && scarName.includes('corrupt')) ||
                (tag === 'necrotic' && scarName.includes('wither')) ||
                (tag === 'psychic' && scarName.includes('witch'));
        });
    });

    if (relevantScars.length === 0) {
        // Fallback to generic scar
        const generic = SCAR_REGISTRY.find(s => s.name === 'Deep Scar');
        if (!generic) return null;

        return {
            ...generic,
            id: `scar_${memberId}_${wound.day}_${Date.now()}`,
            acquiredDay: wound.day
        };
    }

    // Pick random relevant scar
    const chosen = relevantScars[rng.nextInt(0, relevantScars.length - 1)];
    return {
        ...chosen,
        id: `scar_${memberId}_${wound.day}_${Date.now()}`,
        acquiredDay: wound.day
    };
}

/**
 * Get guaranteed scar from revival
 */
export function getRevivalScar(
    seed: string,
    memberId: CharacterId,
    day: number,
    deathCount: number
): Scar {
    const rng = new SeededRandom(`${seed}_revival_scar_${memberId}_${day}`);

    // Revival scars get more severe with each death
    const revivalScars = SCAR_REGISTRY.filter(s => s.source === 'revival');

    let chosen: typeof SCAR_REGISTRY[0];
    if (deathCount <= 1) {
        // First death - minor revival scar
        chosen = revivalScars[0] || SCAR_REGISTRY[0];
    } else {
        // Multiple deaths - worse scars
        chosen = revivalScars[rng.nextInt(0, revivalScars.length - 1)];
    }

    return {
        ...chosen,
        id: `scar_revival_${memberId}_${day}_${deathCount}`,
        acquiredDay: day
    };
}

/**
 * Add scar to member, replacing oldest if at cap
 */
export function addScar(
    currentScars: Scar[],
    newScar: Scar,
    _seed: string
): Scar[] {
    // If under cap, just add
    if (currentScars.length < SCAR_LIMITS.MAX_ACTIVE) {
        return [...currentScars, newScar];
    }

    // At cap - replace oldest non-locked scar
    const removableScars = currentScars.filter(s => !s.locked);
    if (removableScars.length === 0) {
        // All scars locked, can't add new one
        return currentScars;
    }

    // Find oldest removable scar
    const oldest = removableScars.reduce((old, scar) =>
        scar.acquiredDay < old.acquiredDay ? scar : old
    );

    return [
        ...currentScars.filter(s => s.id !== oldest.id),
        newScar
    ];
}

/**
 * Calculate total modifier from scars
 */
export function calculateScarModifiers(scars: Scar[]): Map<string, number> {
    const mods = new Map<string, number>();

    for (const scar of scars) {
        for (const mod of scar.mods) {
            if (mod.stat && mod.amount !== undefined) {
                const current = mods.get(mod.stat) || 0;
                mods.set(mod.stat, current + mod.amount);
            }
            if (mod.type) {
                const current = mods.get(mod.type) || 0;
                const value = mod.percent !== undefined ? mod.percent : (mod.amount || 0);
                mods.set(mod.type, current + value);
            }
        }
    }

    return mods;
}

/**
 * Apply scar modifiers to stat value
 */
export function applyScarModifiers(
    baseValue: number,
    stat: string,
    scarMods: Map<string, number>
): number {
    const modifier = scarMods.get(stat) || 0;
    return Math.max(1, baseValue + modifier); // Stats can't go below 1
}

/**
 * Check if member has visible scars (affects NPC reactions)
 */
export function hasVisibleScars(scars: Scar[]): boolean {
    return scars.some(s => s.visible);
}

/**
 * Get scar description for UI
 */
export function getScarTooltip(scar: Scar): string {
    let tooltip = `${scar.name}\n${scar.description}\n\n`;

    for (const mod of scar.mods) {
        if (mod.stat && mod.amount !== undefined) {
            const sign = mod.amount >= 0 ? '+' : '';
            tooltip += `${sign}${mod.amount} ${mod.stat}\n`;
        }
        if (mod.type && mod.percent !== undefined) {
            const sign = mod.percent >= 0 ? '+' : '';
            tooltip += `${sign}${mod.percent}% ${mod.type.replace(/_/g, ' ')}\n`;
        }
    }

    if (scar.locked) {
        tooltip += '\n(Story Scar - Cannot be replaced)';
    }

    return tooltip;
}

/**
 * Create scar applied event
 */
export function createScarAppliedEvent(
    memberId: CharacterId,
    scar: Scar
): ProgressionEvent {
    return {
        type: 'scar/applied',
        memberId,
        scar
    };
}

/**
 * Create wound applied event
 */
export function createWoundAppliedEvent(
    memberId: CharacterId,
    wound: Wound
): ProgressionEvent {
    return {
        type: 'wound/applied',
        memberId,
        wound
    };
}

/**
 * Get all available scars (for reference)
 */
export function getAllScars(): ReadonlyArray<Omit<Scar, 'acquiredDay' | 'id'>> {
    return SCAR_REGISTRY;
}
