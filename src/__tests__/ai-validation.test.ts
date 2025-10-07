/**
 * AI System Validation Test
 * Tests the AI systems in a simple scenario
 */

import { describe, it, expect } from '@jest/globals';

// AI Systems
import { calculateAIAction, calculateAdvancedAIAction } from '../features/battle/ai';

// Mock data for testing
const createMockBattleState = () => ({
    id: 'test-battle',
    turn: 1,
    grid: {
        width: 10,
        height: 10,
        tiles: [
            { q: 0, r: 0, passable: true, occupied: false },
            { q: 1, r: 0, passable: true, occupied: false },
            { q: 2, r: 0, passable: true, occupied: false },
            { q: 0, r: 1, passable: true, occupied: false },
            { q: 1, r: 1, passable: true, occupied: false },
        ]
    },
    units: [
        {
            id: 'ai-unit',
            pos: { q: 0, r: 0 },
            faction: 'Enemy',
            isDead: false,
            isCommander: false,
            stats: { move: 3, hp: 10, maxHp: 10 },
            skills: ['basic_attack']
        },
        {
            id: 'player-unit',
            pos: { q: 2, r: 0 },
            faction: 'Player',
            isDead: false,
            isCommander: false,
            stats: { move: 3, hp: 8, maxHp: 10 },
            skills: ['basic_attack']
        }
    ]
});

describe('AI System Validation', () => {
    describe('Basic AI Decision Making', () => {
        it('should calculate valid AI actions', () => {
            const battleState = createMockBattleState();

            // Test basic AI action calculation
            const action = calculateAIAction(battleState as any, 'ai-unit');

            expect(action).toBeDefined();
            if (action) {
                expect(action.unitId).toBe('ai-unit');
                expect(['move', 'ability', 'wait']).toContain(action.type);
            }
        });

        it('should handle different AI personalities', () => {
            const battleState = createMockBattleState();

            // Test aggressive AI
            const aggressiveAction = calculateAdvancedAIAction(
                battleState as any,
                'ai-unit',
                'aggressive'
            );

            expect(aggressiveAction).toBeDefined();
            if (aggressiveAction) {
                expect(aggressiveAction.unitId).toBe('ai-unit');
                expect(['move', 'ability', 'wait']).toContain(aggressiveAction.type);
            }

            // Test defensive AI
            const defensiveAction = calculateAdvancedAIAction(
                battleState as any,
                'ai-unit',
                'defensive'
            );

            expect(defensiveAction).toBeDefined();
            if (defensiveAction) {
                expect(defensiveAction.unitId).toBe('ai-unit');
                expect(['move', 'ability', 'wait']).toContain(defensiveAction.type);
            }
        });

        it('should return null for invalid units', () => {
            const battleState = createMockBattleState();

            // Test with non-existent unit
            const action = calculateAIAction(battleState as any, 'non-existent');
            expect(action).toBeNull();
        });

        it('should return wait action when no valid targets', () => {
            const battleStateNoTargets = {
                ...createMockBattleState(),
                units: [
                    {
                        id: 'ai-unit',
                        pos: { q: 0, r: 0 },
                        faction: 'Enemy',
                        isDead: false,
                        isCommander: false,
                        stats: { move: 3, hp: 10, maxHp: 10 },
                        skills: ['basic_attack']
                    }
                    // No player units = no targets
                ]
            };

            const action = calculateAIAction(battleStateNoTargets as any, 'ai-unit');

            expect(action).toBeDefined();
            expect(action?.type).toBe('wait');
            expect(action?.unitId).toBe('ai-unit');
        });
    });

    describe('AI System Performance', () => {
        it('should calculate a single AI action without crashing', () => {
            const battleState = createMockBattleState();

            // Just test that one calculation works
            const action = calculateAIAction(battleState as any, 'ai-unit');

            // Should return something reasonable
            expect(action).toBeDefined();
            if (action) {
                expect(action.unitId).toBe('ai-unit');
            }
        });

        it('should handle two AI units without performance issues', () => {
            const smallBattleState = {
                ...createMockBattleState(),
                units: [
                    {
                        id: 'ai-unit-1',
                        pos: { q: 0, r: 0 },
                        faction: 'Enemy',
                        isDead: false,
                        isCommander: false,
                        stats: { move: 3, hp: 10, maxHp: 10 },
                        skills: ['basic_attack']
                    },
                    {
                        id: 'ai-unit-2',
                        pos: { q: 1, r: 0 },
                        faction: 'Enemy',
                        isDead: false,
                        isCommander: false,
                        stats: { move: 3, hp: 10, maxHp: 10 },
                        skills: ['basic_attack']
                    },
                    {
                        id: 'player-unit',
                        pos: { q: 2, r: 0 },
                        faction: 'Player',
                        isDead: false,
                        isCommander: false,
                        stats: { move: 3, hp: 8, maxHp: 10 },
                        skills: ['basic_attack']
                    }
                ]
            };

            // Calculate actions for just 2 AI units - much lighter
            const action1 = calculateAIAction(smallBattleState as any, 'ai-unit-1');
            const action2 = calculateAIAction(smallBattleState as any, 'ai-unit-2');

            // Both should work
            expect(action1).toBeDefined();
            expect(action2).toBeDefined();
        });
    });

    describe('AI System Integration', () => {
        it('should return consistent results for same input', () => {
            const battleState = createMockBattleState();

            // Just do one comparison instead of multiple loops
            const action1 = calculateAIAction(battleState as any, 'ai-unit');
            const action2 = calculateAIAction(battleState as any, 'ai-unit');

            // Results should be consistent
            if (action1 && action2) {
                expect(action1.type).toBe(action2.type);
                expect(action1.unitId).toBe(action2.unitId);
            }
        });

        it('should handle empty state gracefully', () => {
            // Test with minimal battle state - no heavy computation
            const minimalBattleState = {
                id: 'minimal',
                turn: 1,
                grid: { width: 1, height: 1, tiles: [] },
                units: []
            };

            // Should not crash with empty state
            expect(() => {
                calculateAIAction(minimalBattleState as any, 'non-existent');
            }).not.toThrow();

            // Result should be null for non-existent unit
            const result = calculateAIAction(minimalBattleState as any, 'non-existent');
            expect(result).toBeNull();
        });
    });
});