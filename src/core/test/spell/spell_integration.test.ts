/**
 * Spell System Integration Tests
 * Tests the complete spell casting workflow
 */

import { describe, it, expect } from '@jest/globals';
import type { Unit } from '../../unit/types';
import type { WorldState } from '../../action/types';
import { checkGating, checkFullGating, ALLOWED } from '../../spell/gating';
import { getSpellById, Spells } from '../../spell/registry';
import { selectHexes } from '../../spell/selectors';
import { applySpell } from '../../spell/resolver';
import { createSpellAction, validateSpellAction } from '../../spell/action-glue';

describe('Spell System Integration', () => {
    // Test data
    const mockCaster: Unit = {
        id: 'caster1',
        name: 'Fire Mage',
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

    const mockWorld: WorldState = {
        units: new Map([['caster1', { id: 'caster1', team: 'player', pos: { q: 0, r: 0 }, hp: 50, mp: 30, ap: 3, speed: 11 }]]),
        occupied: new Set(['0,0']),
        terrainCost: () => 1,
        passable: () => true,
        blocksLos: () => false,
        rng: () => 0.5
    };

    describe('Spell Registry', () => {
        it('should contain expected spells', () => {
            expect(getSpellById('fire.bolt')).toBeDefined();
            expect(getSpellById('fire.flame_cone')).toBeDefined();
            expect(getSpellById('body.mend')).toBeDefined();
            expect(getSpellById('nonexistent')).toBeUndefined();
        });

        it('should have properly structured spell data', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            expect(fireBolt.id).toBe('fire.bolt');
            expect(fireBolt.name).toBe('Firebolt');
            expect(fireBolt.school).toBe('Fire');
            expect(fireBolt.level).toBe(1);
            expect(fireBolt.manaCost).toBeGreaterThan(0);
            expect(fireBolt.effects).toHaveLength(1);
            expect(fireBolt.effects[0]).toMatchObject({
                kind: 'damage',
                damageKind: 'Magical',
                school: 'Fire'
            });
        });
    });

    describe('Spell Gating', () => {
        it('should allow casting when requirements are met', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkGating(mockCaster, fireBolt);
            expect(result.canCast).toBe(true);
            expect(result.reasons).toHaveLength(0);
        });

        it('should prevent casting when mana is insufficient', () => {
            const lowManaCaster = { ...mockCaster, mp: 1 };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkGating(lowManaCaster, fireBolt);
            expect(result.canCast).toBe(false);
            expect(result.reasons).toContain('Insufficient mana (need 5, have 1)');
        });

        it('should check action points in full gating', () => {
            const lowApCaster = { ...mockCaster, ap: 0 };
            const fireBolt = getSpellById('fire.bolt')!;
            const result = checkFullGating(lowApCaster, fireBolt, 2);
            expect(result.canCast).toBe(false);
            expect(result.reasons).toContain('Insufficient action points (need 2, have 0)');
        });

        it('should handle level requirements', () => {
            const worldfire = getSpellById('hero.fire.worldfire')!;
            const lowLevelCaster = { ...mockCaster, level: 2 };
            const result = checkGating(lowLevelCaster, worldfire);
            expect(result.canCast).toBe(false);
            expect(result.reasons.some(r => r.includes('Requires level'))).toBe(true);
        });
    });

    describe('Target Selection', () => {
        it('should select single target correctly', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            const origin = { q: 0, r: 0 };
            const target = { q: 1, r: 0 };

            const targets = selectHexes(
                fireBolt,
                origin,
                target,
                () => false, // no LOS blocks
                () => true,  // all passable
                () => false  // none occupied
            );

            expect(targets).toHaveLength(1);
            expect(targets[0]).toEqual(target);
        });

        it('should respect LOS blocking', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            const origin = { q: 0, r: 0 };
            const target = { q: 2, r: 0 };

            // Block LOS at (1,0)
            const blocksLos = (hex: any) => hex.q === 1 && hex.r === 0;

            const targets = selectHexes(
                fireBolt,
                origin,
                target,
                blocksLos,
                () => true,
                () => false
            );

            expect(targets).toHaveLength(0); // Should be empty due to LOS block
        });

        it('should handle cone AOE', () => {
            const flameCone = getSpellById('fire.flame_cone')!;
            const origin = { q: 0, r: 0 };
            const target = { q: 2, r: 0 };

            const targets = selectHexes(
                flameCone,
                origin,
                target,
                () => false,
                () => true,
                () => false
            );

            expect(targets.length).toBeGreaterThan(1); // Cone should hit multiple hexes
        });
    });

    describe('Action System Integration', () => {
        it('should create valid spell actions', () => {
            const action = createSpellAction(
                'caster1',
                'fire.bolt',
                { q: 0, r: 0 },
                { q: 1, r: 0 }
            );

            expect(action.actor).toBe('caster1');
            expect(action.kind).toBe('cast');
            expect(action.data.spellId).toBe('fire.bolt');
            expect(action.cost.mana).toBe(5);
        });

        it('should validate spell actions correctly', () => {
            const validAction = createSpellAction(
                'caster1',
                'fire.bolt',
                { q: 0, r: 0 },
                { q: 1, r: 0 }
            );

            const result = validateSpellAction(mockCaster, validAction);
            expect(result.ok).toBe(true);
        });

        it('should reject invalid spell actions', () => {
            const invalidAction = {
                actor: 'caster1',
                kind: 'cast' as const,
                targets: [],
                cost: { ap: 1 },
                data: { spellId: 'nonexistent.spell' }
            };

            const result = validateSpellAction(mockCaster, invalidAction);
            expect(result.ok).toBe(false);
            expect(result.reasons).toContain('Unknown spell: nonexistent.spell');
        });
    });

    describe('Spell Resolution', () => {
        it('should generate deltas for damage spells', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            const targets = [{ q: 1, r: 0 }];

            const deltas = applySpell(mockWorld, 'caster1', fireBolt, targets);

            expect(deltas.deltas.length).toBeGreaterThan(0);
            // Check that the cast is logged with the correct spell ID
            expect(deltas.log.some(log => log.includes('fire.bolt'))).toBe(true);
        });

        it('should handle healing spells', () => {
            const heal = getSpellById('body.mend')!;
            const targets = [{ q: 0, r: 0 }]; // Self-target

            const deltas = applySpell(mockWorld, 'caster1', heal, targets);

            expect(deltas.deltas.length).toBeGreaterThan(0);
            // Check that the healing is logged with the correct spell ID
            expect(deltas.log.some(log => log.includes('body.mend'))).toBe(true);
        });

        it('should apply mana cost to caster', () => {
            const fireBolt = getSpellById('fire.bolt')!;
            const targets = [{ q: 1, r: 0 }];

            const deltas = applySpell(mockWorld, 'caster1', fireBolt, targets);

            // Should have a mana cost delta for the caster
            const manaDelta = deltas.deltas.find(d =>
                d.kind === 'mp' && d.id === 'caster1'
            );
            expect(manaDelta).toBeDefined();
            if (manaDelta && manaDelta.kind === 'mp') {
                expect(manaDelta.delta).toBe(-fireBolt.manaCost);
            }
        });
    });

    describe('Complete Workflow', () => {
        it('should handle complete spell casting workflow', () => {
            // 1. Check if spell can be cast
            const fireBolt = getSpellById('fire.bolt')!;
            const gatingResult = checkFullGating(mockCaster, fireBolt, 2);
            expect(gatingResult.canCast).toBe(true);

            // 2. Select targets
            const origin = { q: 0, r: 0 };
            const target = { q: 1, r: 0 };
            const targets = selectHexes(
                fireBolt,
                origin,
                target,
                () => false,
                () => true,
                () => false
            );
            expect(targets).toHaveLength(1);

            // 3. Create action
            const action = createSpellAction('caster1', 'fire.bolt', origin, target, 2);
            expect(action.cost.ap).toBe(2);

            // 4. Validate action
            const validation = validateSpellAction(mockCaster, action);
            expect(validation.ok).toBe(true);

            // 5. Apply spell effects
            const deltas = applySpell(mockWorld, 'caster1', fireBolt, targets);
            expect(deltas.deltas.length).toBeGreaterThan(0);
            expect(deltas.log.length).toBeGreaterThan(0);
        });
    });
});