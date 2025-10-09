/**
 * Spell Gating Tests
 * Tests spell requirements and restrictions
 */

import { checkGating, checkActionPoints, checkFullGating, ALLOWED } from '../../spell/gating';
import { getSpellById } from '../../spell/registry';
import type { Unit } from '../../unit/types';

describe('Spell Gating System', () => {
    const baseCaster: Unit = {
        id: 'mage1',
        name: 'Test Mage',
        team: 'player',
        level: 5,
        pos: { q: 0, r: 0 },
        base: { str: 10, dex: 12, con: 11, int: 16, wis: 14, cha: 13, spd: 11, lck: 10 },
        equips: {},
        resist: {},
        hp: 50,
        mp: 30,
        ap: 3,
        statuses: []
    };

    describe('Basic Gating', () => {
        it('should allow casting when all requirements are met', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkGating(baseCaster, fireBolt);

            expect(result).toEqual(ALLOWED);
            expect(result.canCast).toBe(true);
            expect(result.reasons).toHaveLength(0);
        });

        it('should prevent casting when mana is insufficient', () => {
            const lowManaCaster = { ...baseCaster, mp: 1 };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkGating(lowManaCaster, fireBolt);

            expect(result.canCast).toBe(false);
            expect(result.reasons).toContain('Insufficient mana (need 5, have 1)');
        });

        it('should prevent casting when caster is defeated', () => {
            const deadCaster = { ...baseCaster, hp: 0 };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkGating(deadCaster, fireBolt);

            expect(result.canCast).toBe(false);
            expect(result.reasons).toContain('Caster is defeated');
        });

        it('should prevent casting when stunned', () => {
            const stunnedCaster = {
                ...baseCaster,
                statuses: [{ name: 'stunned', turns: 2 }]
            };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkGating(stunnedCaster, fireBolt);

            expect(result.canCast).toBe(false);
            expect(result.reasons).toContain('Caster is stunned');
        });

        it('should prevent casting when silenced', () => {
            const silencedCaster = {
                ...baseCaster,
                statuses: [{ name: 'silenced', turns: 1 }]
            };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkGating(silencedCaster, fireBolt);

            expect(result.canCast).toBe(false);
            expect(result.reasons).toContain('Caster is silenced');
        });

        it('should allow casting when status effects have expired', () => {
            const recoveredCaster = {
                ...baseCaster,
                statuses: [{ name: 'stunned', turns: 0 }] // Expired
            };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkGating(recoveredCaster, fireBolt);

            expect(result.canCast).toBe(true);
        });
    });

    describe('Spell Requirements', () => {
        it('should check minimum level requirements', () => {
            const worldfire = getSpellById('hero.fire.worldfire')!;
            const lowLevelCaster = { ...baseCaster, level: 3 };
            const result = checkGating(lowLevelCaster, worldfire);

            expect(result.canCast).toBe(false);
            expect(result.reasons.some((r: string) => r.includes('Requires level'))).toBe(true);
        });

        it('should allow high-level spells for qualified casters', () => {
            const worldfire = getSpellById('hero.fire.worldfire')!;
            const highLevelCaster = { ...baseCaster, level: 12 };
            const result = checkGating(highLevelCaster, worldfire);

            expect(result.canCast).toBe(true);
        });

        it('should check mastery requirements', () => {
            // Test with a spell that has requirements
            const worldfire = getSpellById('hero.fire.worldfire')!;
            const result = checkGating(baseCaster, worldfire);

            // Level 5 caster should fail mastery requirement (needs level 10)
            expect(result.canCast).toBe(false);
            expect(result.reasons.some((r: string) => r.includes('Requires'))).toBe(true);
        });
    });

    describe('Action Point Gating', () => {
        it('should allow casting with sufficient AP', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkActionPoints(baseCaster, fireBolt, 2);

            expect(result.canCast).toBe(true);
        });

        it('should prevent casting with insufficient AP', () => {
            const lowApCaster = { ...baseCaster, ap: 1 };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkActionPoints(lowApCaster, fireBolt, 3);

            expect(result.canCast).toBe(false);
            expect(result.reasons).toContain('Insufficient action points (need 3, have 1)');
        });
    });

    describe('Full Gating', () => {
        it('should pass comprehensive checks when all requirements are met', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkFullGating(baseCaster, fireBolt, 2);

            expect(result.canCast).toBe(true);
            expect(result.reasons).toHaveLength(0);
        });

        it('should fail when any requirement is not met', () => {
            const problematicCaster = {
                ...baseCaster,
                mp: 1,  // Insufficient mana
                ap: 0   // Insufficient AP
            };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkFullGating(problematicCaster, fireBolt, 2);

            expect(result.canCast).toBe(false);
            expect(result.reasons.length).toBeGreaterThan(1);
            expect(result.reasons).toContain('Insufficient mana (need 5, have 1)');
            expect(result.reasons).toContain('Insufficient action points (need 2, have 0)');
        });

        it('should combine all failure reasons', () => {
            const hopelessCaster = {
                ...baseCaster,
                hp: 0,    // Defeated
                mp: 1,    // Low mana
                ap: 0,    // No AP
                statuses: [{ name: 'stunned', turns: 1 }] // Stunned
            };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkFullGating(hopelessCaster, fireBolt, 2);

            expect(result.canCast).toBe(false);
            expect(result.reasons.length).toBeGreaterThanOrEqual(4);
        });
    });
});