/**
 * TODO #14 — Save/Load System Tests
 * 
 * Comprehensive tests for deterministic serialization, migration, and replay systems.
 */

import {
    createMinimalCombatState,
    validateCombatState,
    CombatStateV3
} from '../schema_combat';
import {
    createMinimalCampaignState,
    validateCampaignState,
    CampaignStateV3
} from '../schema_campaign';
import { encodeSave, decodeSave, computeChecksum, deterministicStringify } from '../encode';
import { migrateSave, needsMigration } from '../migrate';
import { ReplayManager } from '../replay';

describe('TODO #14 — Save/Load System', () => {
    describe('Schema Validation', () => {
        it('should validate minimal combat state', () => {
            const state = createMinimalCombatState();
            expect(validateCombatState(state)).toBe(true);
        });

        it('should validate minimal campaign state', () => {
            const state = createMinimalCampaignState();
            expect(validateCampaignState(state)).toBe(true);
        });

        it('should reject invalid combat state', () => {
            const invalidState = { invalid: true };
            expect(validateCombatState(invalidState)).toBe(false);
        });

        it('should reject invalid campaign state', () => {
            const invalidState = { invalid: true };
            expect(validateCampaignState(invalidState)).toBe(false);
        });
    });

    describe('Deterministic Encoding', () => {
        it('should produce identical JSON for same object', () => {
            const obj = { b: 2, a: 1, c: { z: 3, y: 2, x: 1 } };
            const json1 = deterministicStringify(obj);
            const json2 = deterministicStringify(obj);

            expect(json1).toBe(json2);
            expect(json1).toContain('"a":1,"b":2,"c":{"x":1,"y":2,"z":3}');
        });

        it('should encode and decode save data correctly', async () => {
            const originalState = createMinimalCombatState({
                battleId: 'test_battle',
                seed: 'test_seed_123'
            });

            const encoded = await encodeSave(originalState, { compress: false });
            const decoded = await decodeSave(encoded);

            expect(decoded.isValid).toBe(true);
            const combatData = decoded.data as CombatStateV3;
            expect(combatData.battleId).toBe('test_battle');
            expect(combatData.seed).toBe('test_seed_123');
            expect(combatData.schemaVersion).toBe(3);
        });

        it('should handle compression correctly', async () => {
            const state = createMinimalCombatState();

            const uncompressed = await encodeSave(state, { compress: false });
            const compressed = await encodeSave(state, { compress: true });

            // Compressed should be different but decode to same data
            expect(compressed).not.toBe(uncompressed);

            const decodedUncompressed = await decodeSave(uncompressed);
            const decodedCompressed = await decodeSave(compressed);

            const uncompressedCombat = decodedUncompressed.data as CombatStateV3;
            const compressedCombat = decodedCompressed.data as CombatStateV3;
            expect(uncompressedCombat.battleId).toBe(compressedCombat.battleId);
            expect(decodedCompressed.compressionUsed).toBe(true);
        });
    });

    describe('Checksum Integrity', () => {
        it('should compute consistent checksums', async () => {
            const data = 'test data for checksum';
            const checksum1 = await computeChecksum(data);
            const checksum2 = await computeChecksum(data);

            expect(checksum1).toBe(checksum2);
            expect(checksum1).toHaveLength(64); // SHA-256 produces 64 hex chars
        });

        it('should detect corrupted data', async () => {
            const state = createMinimalCombatState();
            const encoded = await encodeSave(state, { includeChecksum: true });

            // Corrupt the data
            const corrupted = encoded.replace('"battleId":', '"battleId_corrupted":');
            const decoded = await decodeSave(corrupted);

            expect(decoded.isValid).toBe(false);
        });

        it('should validate uncorrupted data', async () => {
            const state = createMinimalCombatState();
            const encoded = await encodeSave(state, { includeChecksum: true });
            const decoded = await decodeSave(encoded);

            expect(decoded.isValid).toBe(true);
        });
    });

    describe('Migration System', () => {
        it('should detect when migration is needed', () => {
            const v1Data = { schemaVersion: 1, someData: 'test' };
            const v3Data = { schemaVersion: 3, someData: 'test' };

            expect(needsMigration(v1Data)).toBe(true);
            expect(needsMigration(v3Data)).toBe(false);
        });

        it('should migrate v1 to v3 successfully', async () => {
            const v1Data = {
                schemaVersion: 1,
                units: [{ id: 'unit1', hp: 100 }],
                terrain: [{ q: 0, r: 0, type: 'grass' }]
            };

            const result = await migrateSave(v1Data);

            expect(result.success).toBe(true);
            expect(result.fromVersion).toBe(1);
            expect(result.toVersion).toBe(3);
            expect(result.data?.schemaVersion).toBe(3);
            expect(result.warnings.length).toBeGreaterThan(0); // Should have migration warnings
        });

        it('should handle migration failures gracefully', async () => {
            const corruptData = {
                schemaVersion: 1,
                invalid: true
            };

            const result = await migrateSave(corruptData);

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should not migrate if already current version', async () => {
            const v3Data = createMinimalCombatState();

            const result = await migrateSave(v3Data);

            expect(result.success).toBe(true);
            expect(result.fromVersion).toBe(3);
            expect(result.toVersion).toBe(3);
            expect(result.warnings).toHaveLength(0);
        });
    });

    describe('Replay System', () => {
        let replayManager: ReplayManager;
        let baseState: ReturnType<typeof createMinimalCombatState>;

        beforeEach(() => {
            replayManager = new ReplayManager();
            baseState = createMinimalCombatState({
                battleId: 'test_replay_battle',
                seed: 'replay_seed_123'
            });
        });

        it('should start replay correctly', async () => {
            await replayManager.startReplay(baseState);

            const log = replayManager.getCurrentLog();
            expect(log).not.toBeNull();
            expect(log?.baseSeed).toBe('replay_seed_123');
            expect(log?.deltas).toHaveLength(0);
        });

        it('should record deltas', async () => {
            await replayManager.startReplay(baseState);

            const stateBefore = baseState;
            const stateAfter = {
                ...baseState,
                turnQueue: {
                    ...baseState.turnQueue,
                    currentTurn: 2
                }
            };

            const delta = await replayManager.recordDelta(
                'test_unit',
                'move',
                { from: { q: 0, r: 0 }, to: { q: 1, r: 0 } },
                stateBefore,
                stateAfter
            );

            expect(delta.sequence).toBe(0);
            expect(delta.actor).toBe('test_unit');
            expect(delta.kind).toBe('move');

            const log = replayManager.getCurrentLog();
            expect(log?.deltas).toHaveLength(1);
        });

        it('should replay actions correctly', async () => {
            await replayManager.startReplay(baseState);

            // Record a simple state change
            const stateAfter = {
                ...baseState,
                turnQueue: {
                    ...baseState.turnQueue,
                    currentTurn: 2
                }
            };

            await replayManager.recordDelta(
                'system',
                'advance_turn',
                { newTurn: 2 },
                baseState,
                stateAfter
            );

            const log = replayManager.getCurrentLog()!;
            const replayedState = await replayManager.replayActions(baseState, log);

            expect((replayedState as CombatStateV3).turnQueue.currentTurn).toBe(2);
        });
    });

    describe('Save Roundtrip', () => {
        it('should maintain data integrity through save/load cycle', async () => {
            const originalState = createMinimalCombatState({
                battleId: 'roundtrip_test',
                seed: 'roundtrip_seed',
                units: [
                    {
                        id: 'unit_1',
                        name: 'Test Warrior',
                        faction: 'player',
                        team: 'allies',
                        archetype: 'warrior',
                        level: 5,
                        pos: { q: 3, r: 4 },
                        facing: 2,
                        stats: {
                            hp: 85,
                            maxHp: 100,
                            ap: 4,
                            maxAp: 6,
                            initiative: 12,
                            morale: 2,
                            cohesion: 1
                        },
                        abilities: ['slash', 'guard'],
                        spells: [],
                        activeAbilities: { slash: 0 },
                        statuses: [],
                        equipment: ['sword', 'armor'],
                        modifiers: { strength: 2 },
                        isDead: false,
                        isRouted: false,
                        hasActed: false,
                        hasMovedThisTurn: false
                    }
                ]
            });

            // Encode with full options
            const encoded = await encodeSave(originalState, {
                compress: true,
                includeChecksum: true,
                pretty: false
            });

            // Decode and validate
            const decoded = await decodeSave(encoded);

            expect(decoded.isValid).toBe(true);
            expect(decoded.compressionUsed).toBe(true);

            const loadedState = decoded.data as CombatStateV3;
            expect(loadedState.battleId).toBe('roundtrip_test');
            expect(loadedState.seed).toBe('roundtrip_seed');
            expect(loadedState.units).toHaveLength(1);

            const unit = loadedState.units[0];
            expect(unit.name).toBe('Test Warrior');
            expect(unit.pos.q).toBe(3);
            expect(unit.pos.r).toBe(4);
            expect(unit.stats.hp).toBe(85);
            expect(unit.abilities).toEqual(['slash', 'guard']);
        });

        it('should handle empty data structures correctly', async () => {
            const emptyState = createMinimalCombatState({
                units: [],
                terrain: [],
                objectives: [],
                spellsInFlight: [],
                auraEffects: []
            });

            const encoded = await encodeSave(emptyState);
            const decoded = await decodeSave(encoded);

            expect(decoded.isValid).toBe(true);
            const combatData = decoded.data as CombatStateV3;
            expect(combatData.units).toEqual([]);
            expect(combatData.terrain).toEqual([]);
            expect(combatData.objectives).toEqual([]);
        });
    });

    describe('Performance', () => {
        it('should encode/decode large states efficiently', async () => {
            // Create a large state with many units
            const largeUnits = Array.from({ length: 100 }, (_, i) => ({
                id: `unit_${i}`,
                name: `Unit ${i}`,
                faction: i % 2 === 0 ? 'player' : 'enemy',
                team: i % 2 === 0 ? 'allies' : 'enemies',
                archetype: 'warrior',
                level: Math.floor(i / 10) + 1,
                pos: { q: i % 10, r: Math.floor(i / 10) },
                facing: i % 6,
                stats: {
                    hp: 100 - (i % 50),
                    maxHp: 100,
                    ap: 6,
                    maxAp: 6,
                    initiative: 10 + (i % 10),
                    morale: (i % 21) - 10,
                    cohesion: (i % 11) - 5
                },
                abilities: ['attack', 'defend'],
                spells: [],
                activeAbilities: {},
                statuses: [],
                equipment: ['weapon', 'armor'],
                modifiers: {},
                isDead: i % 20 === 19,
                isRouted: false,
                hasActed: i % 3 === 0,
                hasMovedThisTurn: i % 4 === 0
            }));

            const largeState = createMinimalCombatState({ units: largeUnits });

            const startTime = performance.now();
            const encoded = await encodeSave(largeState, { compress: true });
            const decoded = await decodeSave(encoded);
            const endTime = performance.now();

            expect(decoded.isValid).toBe(true);
            const combatData = decoded.data as CombatStateV3;
            expect(combatData.units).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });
    });
});