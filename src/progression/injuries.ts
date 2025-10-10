/**
 * Canvas 11 - Injuries & Death System
 * 
 * Post-battle injury resolution with damage tags
 * Death mechanics with persistent consequences
 */

import type { Wound, DamageTag, DeathRecord, ProgressionEvent } from './types';
import type { CharacterId } from '../party/types';
import { SeededRandom } from '../proc/noise';
import { rollScarFromWound, createWoundAppliedEvent, createScarAppliedEvent } from './scars';

/**
 * Injury outcome probabilities
 */
const INJURY_CHANCES = {
    minor: 0.50,
    major: 0.35,
    fatal: 0.15
};

/**
 * Healer presence modifiers
 */
const HEALER_MODIFIERS = {
    noHealer: { minor: 0, major: 0, fatal: 0 },
    basicHealer: { minor: 0.10, major: -0.05, fatal: -0.05 },
    expertHealer: { minor: 0.20, major: -0.10, fatal: -0.10 }
};

/**
 * Roll for injury after being downed in battle
 */
export function rollInjury(
    seed: string,
    memberId: CharacterId,
    damageTags: DamageTag[],
    hasHealer: 'none' | 'basic' | 'expert',
    currentDay: number
): Wound | null {
    const rng = new SeededRandom(`${seed}_injury_${memberId}_${currentDay}`);
    
    // Get healer modifiers
    let modifiers = HEALER_MODIFIERS.noHealer;
    if (hasHealer === 'basic') modifiers = HEALER_MODIFIERS.basicHealer;
    if (hasHealer === 'expert') modifiers = HEALER_MODIFIERS.expertHealer;
    
    // Calculate adjusted probabilities
    const chances = {
        minor: Math.min(1.0, INJURY_CHANCES.minor + modifiers.minor),
        major: Math.max(0, INJURY_CHANCES.major + modifiers.major),
        fatal: Math.max(0, INJURY_CHANCES.fatal + modifiers.fatal)
    };
    
    // Normalize probabilities
    const total = chances.minor + chances.major + chances.fatal;
    const roll = rng.nextFloat() * total;
    
    let kind: Wound['kind'];
    if (roll < chances.minor) {
        kind = 'minor';
    } else if (roll < chances.minor + chances.major) {
        kind = 'major';
    } else {
        kind = 'fatal';
    }
    
    // Fatal wounds result in death, not injury
    if (kind === 'fatal') {
        return null;
    }
    
    return {
        kind,
        tags: damageTags,
        day: currentDay,
        source: `battle_${currentDay}`
    };
}

/**
 * Process injury and potentially generate scar
 */
export function processInjury(
    wound: Wound,
    seed: string,
    memberId: CharacterId
): { events: ProgressionEvent[] } {
    const events: ProgressionEvent[] = [];
    
    // Always record wound
    events.push(createWoundAppliedEvent(memberId, wound));
    
    // Check for scar
    const scar = rollScarFromWound(wound, seed, memberId);
    if (scar) {
        events.push(createScarAppliedEvent(memberId, scar));
    }
    
    return { events };
}

/**
 * Process death from fatal wound
 */
export function processDeath(
    memberId: CharacterId,
    memberName: string,
    currentDay: number,
    regionId: string,
    cause: string,
    inventory: Array<{ id: string; name: string; soulbound: boolean }>
): { deathRecord: DeathRecord; droppedLoot: string[]; events: ProgressionEvent[] } {
    // Filter out soulbound items
    const droppedLoot = inventory
        .filter(item => !item.soulbound)
        .map(item => item.name);
    
    const deathRecord: DeathRecord = {
        memberId,
        name: memberName,
        day: currentDay,
        regionId,
        cause,
        loot: droppedLoot
    };
    
    const events: ProgressionEvent[] = [
        {
            type: 'death/recorded',
            memberId,
            deathRecord
        }
    ];
    
    return { deathRecord, droppedLoot, events };
}

/**
 * Check if damage tags indicate fatal wound
 */
export function isFatalWound(
    damageTags: DamageTag[],
    seed: string,
    memberId: CharacterId,
    currentDay: number
): boolean {
    const rng = new SeededRandom(`${seed}_fatal_${memberId}_${currentDay}`);
    
    // Fatal wound chance
    const roll = rng.nextFloat();
    return roll < INJURY_CHANCES.fatal;
}

/**
 * Get wound severity description
 */
export function getWoundDescription(wound: Wound): string {
    const tagDescriptions: Record<DamageTag, string> = {
        crushing: 'broken bones',
        piercing: 'deep puncture wounds',
        slashing: 'severe lacerations',
        fire: 'severe burns',
        frost: 'frostbite damage',
        poison: 'toxic poisoning',
        necrotic: 'withering tissue',
        lightning: 'nerve damage',
        psychic: 'mental trauma',
        holy: 'divine wounds',
        shadow: 'corruption'
    };
    
    const tagList = wound.tags.map(tag => tagDescriptions[tag as DamageTag]).join(', ');
    
    if (wound.kind === 'minor') {
        return `Minor injury: ${tagList}`;
    } else {
        return `Major injury: ${tagList}`;
    }
}

/**
 * Get damage tag descriptions for UI
 */
export function getDamageTagDescription(tag: DamageTag): string {
    const descriptions: Record<DamageTag, string> = {
        crushing: 'Blunt force trauma that breaks bones',
        piercing: 'Deep penetrating wounds that cause bleeding',
        slashing: 'Cutting wounds with severe bleeding',
        fire: 'Burns and scorched tissue',
        frost: 'Frostbite and hypothermia',
        poison: 'Toxins causing organ strain',
        necrotic: 'Tissue death and withering',
        lightning: 'Electrical damage to nerves',
        psychic: 'Mental trauma and psychological wounds',
        holy: 'Divine energy burns',
        shadow: 'Corrupting dark energy'
    };
    
    return descriptions[tag];
}

/**
 * Recommend healing items based on damage tags
 */
export function getRecommendedHealing(damageTags: DamageTag[]): string[] {
    const recommendations = new Set<string>();
    
    for (const tag of damageTags) {
        switch (tag) {
            case 'crushing':
            case 'piercing':
            case 'slashing':
                recommendations.add('Bandages');
                recommendations.add('Health Potion');
                break;
            case 'fire':
                recommendations.add('Cooling Salve');
                recommendations.add('Aloe Extract');
                break;
            case 'frost':
                recommendations.add('Warming Tonic');
                recommendations.add('Heat Stone');
                break;
            case 'poison':
                recommendations.add('Antidote');
                recommendations.add('Cleansing Potion');
                break;
            case 'necrotic':
                recommendations.add('Holy Water');
                recommendations.add('Restoration Draught');
                break;
            case 'lightning':
                recommendations.add('Grounding Crystal');
                recommendations.add('Nerve Tonic');
                break;
            case 'psychic':
                recommendations.add('Mind Ward');
                recommendations.add('Clarity Elixir');
                break;
            case 'holy':
            case 'shadow':
                recommendations.add('Neutralizing Agent');
                recommendations.add('Balance Potion');
                break;
        }
    }
    
    return Array.from(recommendations);
}

/**
 * Calculate injury recovery time in days
 */
export function getRecoveryTime(wound: Wound, hasHealer: boolean): number {
    let baseDays = 0;
    
    if (wound.kind === 'minor') {
        baseDays = 3;
    } else if (wound.kind === 'major') {
        baseDays = 7;
    }
    
    // Healer reduces recovery time
    if (hasHealer) {
        baseDays = Math.ceil(baseDays * 0.75);
    }
    
    return baseDays;
}

/**
 * Create injury event for integration
 */
export function createInjuryEvent(
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
 * Create death event for integration
 */
export function createDeathEvent(
    memberId: CharacterId,
    deathRecord: DeathRecord
): ProgressionEvent {
    return {
        type: 'death/recorded',
        memberId,
        deathRecord
    };
}
