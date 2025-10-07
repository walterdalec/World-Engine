import type { BattleState, Unit, HexPosition } from "./types";

// AI system for battle unit behavior
export interface AIAction {
    type: "move" | "ability" | "wait";
    unitId: string;
    targetPos?: HexPosition;
    abilityId?: string;
}

// Simplified AI for build compatibility while advanced AI is developed
export function calculateAIAction(state: BattleState, unitId: string): AIAction | null {
    // Basic AI stub - just wait for now
    // The morale system works independently of AI complexity
    return { type: "wait", unitId };
}

// Placeholder for advanced AI (to be implemented by Codex)
export function calculateAdvancedAIAction(state: BattleState, unitId: string): AIAction | null {
    // TODO: Advanced AI that considers morale states:
    // - unit.meta?.morale?.state ('steady' | 'shaken' | 'wavering' | 'routing')
    // - unit.meta?.morale?.value (0-100)
    // - Routing units should prioritize escape
    // - Shaken units should be more defensive
    return calculateAIAction(state, unitId);
}

// Placeholder for executing AI turns (to be implemented by Codex)
export function executeAITurn(state: BattleState): void {
    // TODO: Execute AI decision making for all enemy units
    // Should integrate with morale system to make appropriate decisions
}

// Placeholder for AI initialization (to be implemented by Codex)
export function initializeTacticalAI(state: BattleState): void {
    // TODO: Initialize advanced AI systems that use morale data
}

// Placeholder for AI tick updates (to be implemented by Codex)
export function tickTacticalAI(state: BattleState): void {
    // TODO: Update AI decision making based on current morale states
}