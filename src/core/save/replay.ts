/**
 * TODO #14 — Replay System
 * 
 * Deterministic replay functionality with delta logging and verification.
 * Enables undo/redo, replay verification, and debug analysis.
 */

import { CombatStateV3 } from './schema_combat';
import { CampaignStateV3 } from './schema_campaign';
import { computeChecksum, deterministicStringify } from './encode';

export interface ActionDelta {
    /** Unique sequence number for this delta */
    sequence: number;

    /** Timestamp when delta was created */
    timestamp: number;

    /** Actor who triggered this delta (unit ID, player, system) */
    actor: string;

    /** Type of action that caused this delta */
    kind: string;

    /** The actual changes to apply */
    payload: any;

    /** Checksum of state after applying this delta */
    checksum: string;

    /** Reverse operations for undo functionality */
    inverse?: any;

    /** RNG state before this action */
    rngStateBefore: string;

    /** RNG state after this action */
    rngStateAfter: string;
}

export interface ReplayLog {
    /** Unique identifier for this replay */
    replayId: string;

    /** Initial state checksum */
    baseChecksum: string;

    /** Initial RNG seed */
    baseSeed: string;

    /** Initial RNG state */
    baseRngState: string;

    /** Schema version */
    schemaVersion: number;

    /** Build commit hash */
    buildCommit: string;

    /** Creation timestamp */
    created: number;

    /** Ordered list of deltas */
    deltas: ActionDelta[];

    /** Periodic checkpoints for fast seeking */
    checkpoints: Array<{
        sequence: number;
        stateChecksum: string;
        rngState: string;
        compressedState?: string;
    }>;

    /** Metadata about the replay */
    metadata: {
        totalActions: number;
        duration: number;
        participants: string[];
        battleType?: string;
        campaignName?: string;
    };
}

export interface ReplayOptions {
    /** Whether to verify checksums during replay */
    verify?: boolean;

    /** Whether to create periodic checkpoints */
    createCheckpoints?: boolean;

    /** Interval for creating checkpoints (number of deltas) */
    checkpointInterval?: number;

    /** Maximum number of deltas to keep in memory */
    maxDeltas?: number;

    /** Whether to store inverse operations for undo */
    enableUndo?: boolean;
}

export class ReplayManager {
    private currentLog: ReplayLog | null = null;
    private undoStack: ActionDelta[] = [];
    private options: Required<ReplayOptions>;

    constructor(options: ReplayOptions = {}) {
        this.options = {
            verify: true,
            createCheckpoints: true,
            checkpointInterval: 50,
            maxDeltas: 1000,
            enableUndo: true,
            ...options
        };
    }

    /**
     * Start a new replay log for a given state
     */
    async startReplay(
        state: CombatStateV3 | CampaignStateV3,
        replayId?: string
    ): Promise<void> {
        const baseState = { ...state, checksum: '' };
        const baseChecksum = await computeChecksum(deterministicStringify(baseState));

        this.currentLog = {
            replayId: replayId || `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            baseChecksum,
            baseSeed: state.seed,
            baseRngState: state.rngState,
            schemaVersion: state.schemaVersion,
            buildCommit: state.buildCommit,
            created: Date.now(),
            deltas: [],
            checkpoints: [],
            metadata: {
                totalActions: 0,
                duration: 0,
                participants: this.extractParticipants(state),
                battleType: 'battleType' in state ? state.battleType : undefined,
                campaignName: 'campaignName' in state ? state.campaignName : undefined
            }
        };

        this.undoStack = [];
    }

    /**
     * Record a new action delta
     */
    async recordDelta(
        actor: string,
        kind: string,
        payload: any,
        stateBefore: CombatStateV3 | CampaignStateV3,
        stateAfter: CombatStateV3 | CampaignStateV3,
        inverse?: any
    ): Promise<ActionDelta> {
        if (!this.currentLog) {
            throw new Error('No active replay log. Call startReplay() first.');
        }

        const sequence = this.currentLog.deltas.length;
        const stateAfterForChecksum = { ...stateAfter, checksum: '' };
        const checksum = await computeChecksum(deterministicStringify(stateAfterForChecksum));

        const delta: ActionDelta = {
            sequence,
            timestamp: Date.now(),
            actor,
            kind,
            payload,
            checksum,
            inverse: this.options.enableUndo ? inverse : undefined,
            rngStateBefore: stateBefore.rngState,
            rngStateAfter: stateAfter.rngState
        };

        this.currentLog.deltas.push(delta);

        // Add to undo stack if enabled
        if (this.options.enableUndo && inverse) {
            this.undoStack.push(delta);

            // Limit undo stack size
            if (this.undoStack.length > 20) {
                this.undoStack.shift();
            }
        }

        // Create checkpoint if needed
        if (this.options.createCheckpoints &&
            sequence % this.options.checkpointInterval === 0) {
            await this.createCheckpoint(sequence, stateAfter);
        }

        // Update metadata
        this.currentLog.metadata.totalActions = this.currentLog.deltas.length;
        this.currentLog.metadata.duration = Date.now() - this.currentLog.created;

        // Trim old deltas if needed
        if (this.currentLog.deltas.length > this.options.maxDeltas) {
            const excess = this.currentLog.deltas.length - this.options.maxDeltas;
            this.currentLog.deltas.splice(0, excess);

            // Adjust sequences
            this.currentLog.deltas.forEach((d, i) => d.sequence = i);
        }

        return delta;
    }

    /**
     * Replay actions from a log onto a base state
     */
    async replayActions(
        baseState: CombatStateV3 | CampaignStateV3,
        replayLog: ReplayLog,
        options: { upToSequence?: number; verify?: boolean } = {}
    ): Promise<CombatStateV3 | CampaignStateV3> {
        const { upToSequence, verify = this.options.verify } = options;

        // Verify base state if requested
        if (verify) {
            const baseStateForChecksum = { ...baseState, checksum: '' };
            const baseChecksum = await computeChecksum(deterministicStringify(baseStateForChecksum));

            if (baseChecksum !== replayLog.baseChecksum) {
                throw new Error(`Base state checksum mismatch. Expected: ${replayLog.baseChecksum}, Got: ${baseChecksum}`);
            }
        }

        let currentState = { ...baseState };
        const maxSequence = upToSequence ?? replayLog.deltas.length - 1;

        // Find best checkpoint to start from
        let startSequence = 0;
        if (replayLog.checkpoints.length > 0) {
            const checkpoint = replayLog.checkpoints
                .filter(cp => cp.sequence <= maxSequence)
                .sort((a, b) => b.sequence - a.sequence)[0];

            if (checkpoint && checkpoint.compressedState) {
                try {
                    const { decompressString } = await import('./encode');
                    const stateJson = await decompressString(checkpoint.compressedState);
                    currentState = JSON.parse(stateJson);
                    startSequence = checkpoint.sequence + 1;
                } catch (error) {
                    console.warn('Failed to load checkpoint, starting from base state:', error);
                }
            }
        }

        // Apply deltas
        for (let i = startSequence; i <= maxSequence && i < replayLog.deltas.length; i++) {
            const delta = replayLog.deltas[i];
            currentState = this.applyDelta(currentState, delta);

            // Verify checksum if requested
            if (verify) {
                const stateForChecksum = { ...currentState, checksum: '' };
                const checksum = await computeChecksum(deterministicStringify(stateForChecksum));

                if (checksum !== delta.checksum) {
                    throw new Error(`Checksum mismatch at sequence ${delta.sequence}. Expected: ${delta.checksum}, Got: ${checksum}`);
                }
            }
        }

        return currentState;
    }

    /**
     * Apply a single delta to a state
     */
    private applyDelta(
        state: CombatStateV3 | CampaignStateV3,
        delta: ActionDelta
    ): CombatStateV3 | CampaignStateV3 {
        // This is a simplified implementation
        // In practice, you'd have specific handlers for different delta kinds
        const newState = { ...state };

        // Update RNG state
        newState.rngState = delta.rngStateAfter;

        // Apply payload changes (this would be more sophisticated in practice)
        if (delta.payload && typeof delta.payload === 'object') {
            Object.assign(newState, delta.payload);
        }

        return newState;
    }

    /**
     * Create a checkpoint for fast seeking
     */
    private async createCheckpoint(
        sequence: number,
        state: CombatStateV3 | CampaignStateV3
    ): Promise<void> {
        if (!this.currentLog) return;

        const stateForChecksum = { ...state, checksum: '' };
        const stateChecksum = await computeChecksum(deterministicStringify(stateForChecksum));

        let compressedState: string | undefined;
        try {
            const { compressString } = await import('./encode');
            compressedState = await compressString(deterministicStringify(state));
        } catch (error) {
            console.warn('Failed to compress checkpoint state:', error);
        }

        this.currentLog.checkpoints.push({
            sequence,
            stateChecksum,
            rngState: state.rngState,
            compressedState
        });

        // Limit checkpoint count
        if (this.currentLog.checkpoints.length > 20) {
            this.currentLog.checkpoints.shift();
        }
    }

    /**
     * Get the current replay log
     */
    getCurrentLog(): ReplayLog | null {
        return this.currentLog;
    }

    /**
     * Get available undo operations
     */
    getUndoStack(): ActionDelta[] {
        return [...this.undoStack];
    }

    /**
     * Clear the current replay log
     */
    clearReplay(): void {
        this.currentLog = null;
        this.undoStack = [];
    }

    /**
     * Extract participant information from state
     */
    private extractParticipants(state: CombatStateV3 | CampaignStateV3): string[] {
        if ('units' in state) {
            // Combat state
            const factions = new Set(state.units.map(u => u.faction));
            return Array.from(factions);
        } else {
            // Campaign state
            return state.factions.map(f => f.id);
        }
    }
}

/**
 * Utility function to verify replay integrity
 */
export async function verifyReplay(
    baseState: CombatStateV3 | CampaignStateV3,
    replayLog: ReplayLog
): Promise<{
    valid: boolean;
    errors: string[];
    finalChecksum: string;
}> {
    const errors: string[] = [];

    try {
        const replayManager = new ReplayManager({ verify: true });
        const finalState = await replayManager.replayActions(baseState, replayLog);

        const finalStateForChecksum = { ...finalState, checksum: '' };
        const finalChecksum = await computeChecksum(deterministicStringify(finalStateForChecksum));

        return {
            valid: errors.length === 0,
            errors,
            finalChecksum
        };

    } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');

        return {
            valid: false,
            errors,
            finalChecksum: ''
        };
    }
}