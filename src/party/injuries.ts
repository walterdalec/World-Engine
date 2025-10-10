/**
 * Canvas 10 - Injuries & Death System
 * 
 * Downed → injury/death rolls; persistent scars (Canvas 11 hook)
 * Post-battle resolution with deterministic rolls
 */

import type { PartyMember, InjurySeverity, PartyEvent } from './types';
import { SeededRandom } from '../proc/noise';

/**
 * Injury roll result
 */
export interface InjuryRollResult {
    severity: InjurySeverity;
    injured: boolean;
    dead: boolean;
    scar?: string;
}

/**
 * Injury thresholds based on damage source and difficulty
 */
const INJURY_THRESHOLDS = {
    light: 0.7,    // 70% HP lost - minor injury
    serious: 0.85, // 85% HP lost - serious injury
    critical: 0.95, // 95% HP lost - critical injury
    fatal: 1.0     // 100% HP lost - death possible
};

/**
 * Death chance by severity (modified by difficulty)
 */
const DEATH_CHANCES = {
    light: 0.0,
    serious: 0.05,
    critical: 0.15,
    fatal: 0.30
};

/**
 * Roll for injury after being downed
 * Uses deterministic seed for replay consistency
 */
export function rollInjury(
    member: PartyMember,
    damagePercent: number,
    seed: string,
    difficulty: number = 1.0
): InjuryRollResult {
    const rng = new SeededRandom(`${seed}_injury_${member.id}`);

    // Determine severity based on damage
    let severity: InjurySeverity = 'light';
    if (damagePercent >= INJURY_THRESHOLDS.fatal) {
        severity = 'fatal';
    } else if (damagePercent >= INJURY_THRESHOLDS.critical) {
        severity = 'critical';
    } else if (damagePercent >= INJURY_THRESHOLDS.serious) {
        severity = 'serious';
    }

    // Roll for death
    const deathChance = DEATH_CHANCES[severity] * difficulty;
    const deathRoll = rng.nextFloat();
    const dead = deathRoll < deathChance;

    // If not dead, apply injury
    const injured = !dead && severity !== 'light';

    // Scar chance increases with severity (Canvas 11 will expand)
    let scar: string | undefined;
    if (injured && rng.nextFloat() < 0.3) {
        scar = generateScar(severity, rng);
    }

    return {
        severity,
        injured,
        dead,
        scar
    };
}

/**
 * Generate scar from injury (placeholder for Canvas 11)
 */
function generateScar(severity: InjurySeverity, rng: SeededRandom): string {
    const scars = {
        serious: [
            'facial_scar',
            'limping',
            'chronic_pain',
            'weak_arm'
        ],
        critical: [
            'missing_finger',
            'eye_damage',
            'deep_wound',
            'nerve_damage'
        ],
        fatal: [
            'near_death_trauma',
            'organ_damage',
            'permanent_disability'
        ]
    };

    const pool = scars[severity as keyof typeof scars] || scars.serious;
    return pool[rng.nextInt(0, pool.length - 1)];
}

/**
 * Apply injury to member
 */
export function applyInjury(
    member: PartyMember,
    result: InjuryRollResult
): PartyMember {
    if (result.dead) {
        return {
            ...member,
            dead: true,
            hp: 0,
            injured: false
        };
    }

    if (result.injured) {
        const scars = result.scar ? [...member.scars, result.scar] : member.scars;

        return {
            ...member,
            injured: true,
            scars
        };
    }

    return member;
}

/**
 * Clear injury flag (after rest/healing)
 */
export function healInjury(member: PartyMember): PartyMember {
    return {
        ...member,
        injured: false
    };
}

/**
 * Check if member can be revived (Canvas 11 ritual system)
 */
export function canRevive(member: PartyMember): boolean {
    // Placeholder - Canvas 11 will add revival ritual requirements
    return member.dead === true;
}

/**
 * Revive member (Canvas 11 will expand with costs/requirements)
 */
export function reviveMember(
    member: PartyMember,
    cost: number
): { member: PartyMember; event: PartyEvent } {
    const revived: PartyMember = {
        ...member,
        dead: false,
        hp: Math.floor(member.maxHp * 0.1), // Revive at 10% HP
        injured: true, // Always injured after revival
        scars: [...member.scars, 'death_scar'] // Permanent mark
    };

    const event: PartyEvent = {
        type: 'party/revived',
        memberId: member.id,
        name: member.name,
        cost
    };

    return { member: revived, event };
}

/**
 * Process post-battle injuries for entire party
 */
export function processBattleInjuries(
    members: PartyMember[],
    seed: string,
    difficulty: number = 1.0
): { members: PartyMember[]; events: PartyEvent[] } {
    const events: PartyEvent[] = [];
    const updatedMembers: PartyMember[] = [];

    for (const member of members) {
        if (member.dead) {
            updatedMembers.push(member);
            continue;
        }

        // Check if member was downed (0 HP)
        if (member.hp <= 0) {
            const damagePercent = 1.0 - (member.hp / member.maxHp);
            const result = rollInjury(member, damagePercent, seed, difficulty);

            const updated = applyInjury(member, result);
            updatedMembers.push(updated);

            if (result.dead) {
                events.push({
                    type: 'party/death',
                    memberId: member.id,
                    name: member.name,
                    cause: `combat_${result.severity}`
                });
            } else if (result.injured) {
                events.push({
                    type: 'party/injured',
                    memberId: member.id,
                    severity: result.severity
                });
            }
        } else {
            updatedMembers.push(member);
        }
    }

    return { members: updatedMembers, events };
}

/**
 * Get injury status text
 */
export function getInjuryStatus(member: PartyMember): string {
    if (member.dead) return 'Dead';
    if (member.injured) return 'Injured';
    if (member.hp < member.maxHp * 0.3) return 'Critical';
    if (member.hp < member.maxHp * 0.5) return 'Wounded';
    return 'Healthy';
}

/**
 * Calculate revival cost (Canvas 11 will expand)
 */
export function calculateRevivalCost(member: PartyMember): number {
    // Base cost scales with level
    let cost = member.level * 100;

    // Each death scar increases cost
    const deathScars = member.scars.filter(s => s.includes('death')).length;
    cost *= Math.pow(1.5, deathScars);

    return Math.floor(cost);
}
