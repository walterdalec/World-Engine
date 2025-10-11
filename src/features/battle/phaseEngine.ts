/**
 * Phase-Based Battle Engine (Brigandine-style)
 * 
 * Key improvements over initiative-based system:
 * - Clear phase boundaries: Player → Enemy → Repeat
 * - Per-phase action flags (move/attack per phase)
 * - Event-driven architecture for clean UI integration
 * - Deterministic execution order
 * - Better tactical planning (know when enemy acts)
 */

import type { BattleState, Unit, HexPosition } from './types';
import { hexDistance, tileAtFast } from './engine';
import { hexRing } from './hexUtils';

// ============================================================================
// BATTLE EVENTS - Single source of truth for everything that happens
// ============================================================================

export type BattleEvent =
    | { type: 'BattleStart'; round: number }
    | { type: 'PhaseStart'; phase: 'Player' | 'Enemy'; round: number }
    | { type: 'PhaseEnd'; phase: 'Player' | 'Enemy' }
    | { type: 'UnitActivated'; unitId: string; faction: 'Player' | 'Enemy' }
    | { type: 'Move'; unitId: string; from: HexPosition; to: HexPosition; cost: number }
    | { type: 'Attack'; attackerId: string; defenderId: string; range: number }
    | { type: 'Damage'; targetId: string; amount: number; remaining: number; damageType?: string }
    | { type: 'Heal'; targetId: string; amount: number; remaining: number }
    | { type: 'StatusApplied'; targetId: string; statusId: string; duration: number }
    | { type: 'StatusExpired'; targetId: string; statusId: string }
    | { type: 'Death'; unitId: string; killedBy?: string }
    | { type: 'AbilityUsed'; unitId: string; abilityId: string; targetPos?: HexPosition }
    | { type: 'MoraleChange'; unitId: string; oldValue: number; newValue: number; reason: string }
    | { type: 'RoundEnd'; round: number }
    | { type: 'BattleEnd'; winner: 'Player' | 'Enemy' | 'Draw'; round: number };

// ============================================================================
// PHASE ENGINE - Manages turn flow and enforces phase rules
// ============================================================================

export class PhaseEngine {
    readonly state: BattleState;
    readonly events: BattleEvent[] = [];
    private phaseActions: Map<string, { moved: boolean; acted: boolean }> = new Map();

    constructor(state: BattleState) {
        this.state = state;
    }

    // ------------------------------------------------------------------------
    // Event logging
    // ------------------------------------------------------------------------

    emit(event: BattleEvent): void {
        this.events.push(event);

        // Also add to battle log for UI display
        const logMessage = this.formatEventForLog(event);
        if (logMessage) {
            this.state.log.push(logMessage);
        }
    }

    private formatEventForLog(event: BattleEvent): string | null {
        const getUnitName = (id: string) => this.state.units.find(u => u.id === id)?.name ?? id;

        switch (event.type) {
            case 'BattleStart':
                return `⚔️ Battle begins! (Round ${event.round})`;
            case 'PhaseStart':
                return `[${event.phase} Phase] Round ${event.round}`;
            case 'Move':
                return `🚶 ${getUnitName(event.unitId)} moves`;
            case 'Attack':
                return `⚔️ ${getUnitName(event.attackerId)} attacks ${getUnitName(event.defenderId)}`;
            case 'Damage':
                return `   💥 ${event.amount} damage dealt (${event.remaining} HP remaining)`;
            case 'Death':
                return `💀 ${getUnitName(event.unitId)} has fallen!`;
            case 'BattleEnd':
                return `🏁 Battle Over - ${event.winner} wins!`;
            default:
                return null; // Don't log every event type
        }
    }

    // ------------------------------------------------------------------------
    // Phase management
    // ------------------------------------------------------------------------

    startBattle(): void {
        this.state.turn = 1;
        this.state.phase = 'HeroTurn'; // Map to Player phase
        this.emit({ type: 'BattleStart', round: this.state.turn });
        this.resetPhaseFlags('Player');
        this.resetPhaseFlags('Enemy');
    }

    startPhase(faction: 'Player' | 'Enemy'): void {
        this.resetPhaseFlags(faction);
        const mappedPhase = faction === 'Player' ? 'HeroTurn' : 'EnemyTurn';
        this.state.phase = mappedPhase;
        this.emit({ type: 'PhaseStart', phase: faction, round: this.state.turn });
    }

    endPhase(faction: 'Player' | 'Enemy'): void {
        this.emit({ type: 'PhaseEnd', phase: faction });

        // Check for battle end
        if (this.checkBattleEnd()) {
            return;
        }

        // Advance to next phase
        if (faction === 'Player') {
            this.startPhase('Enemy');
        } else {
            // End of round - process effects and start new round
            this.endRound();
        }
    }

    private endRound(): void {
        this.emit({ type: 'RoundEnd', round: this.state.turn });

        // Process end-of-turn effects
        this.tickStatusEffects();
        this.tickCooldowns();

        // Start new round
        this.state.turn++;
        this.startPhase('Player');
    }

    private resetPhaseFlags(faction: 'Player' | 'Enemy'): void {
        const units = this.getUnitsOfFaction(faction);
        units.forEach(u => {
            this.phaseActions.set(u.id, { moved: false, acted: false });
        });
    }

    hasMovedThisPhase(unitId: string): boolean {
        return this.phaseActions.get(unitId)?.moved ?? false;
    }

    hasActedThisPhase(unitId: string): boolean {
        return this.phaseActions.get(unitId)?.acted ?? false;
    }

    private markMoved(unitId: string): void {
        const current = this.phaseActions.get(unitId) ?? { moved: false, acted: false };
        this.phaseActions.set(unitId, { ...current, moved: true });
    }

    private markActed(unitId: string): void {
        const current = this.phaseActions.get(unitId) ?? { moved: false, acted: false };
        this.phaseActions.set(unitId, { ...current, acted: true });
    }

    // ------------------------------------------------------------------------
    // Unit queries
    // ------------------------------------------------------------------------

    private getUnitsOfFaction(faction: 'Player' | 'Enemy'): Unit[] {
        return this.state.units.filter(u =>
            u.faction === faction &&
            !u.isDead &&
            !u.isCommander &&
            u.pos !== undefined
        );
    }

    private getUnit(unitId: string): Unit | undefined {
        return this.state.units.find(u => u.id === unitId);
    }

    private getUnitAt(pos: HexPosition): Unit | undefined {
        return this.state.units.find(u =>
            !u.isDead &&
            u.pos &&
            u.pos.q === pos.q &&
            u.pos.r === pos.r
        );
    }

    // ------------------------------------------------------------------------
    // Movement
    // ------------------------------------------------------------------------

    canMove(unitId: string): boolean {
        const unit = this.getUnit(unitId);
        if (!unit || unit.isDead || !unit.pos) return false;
        if (this.hasMovedThisPhase(unitId)) return false;

        const currentPhase = this.state.phase === 'HeroTurn' || this.state.phase === 'UnitsTurn' ? 'Player' : 'Enemy';
        if (unit.faction !== currentPhase) return false;

        return true;
    }

    getValidMoves(unitId: string): HexPosition[] {
        const unit = this.getUnit(unitId);
        if (!unit || !this.canMove(unitId) || !unit.pos) return [];

        const validMoves: HexPosition[] = [];
        const maxRange = unit.stats.move;

        // Check all hexes within movement range using rings
        for (let range = 1; range <= maxRange; range++) {
            const ring = hexRing(unit.pos, range);
            for (const hex of ring) {
                const tile = tileAtFast(this.state.grid, hex);
                if (tile && tile.passable && !tile.occupied && !this.getUnitAt(hex)) {
                    validMoves.push(hex);
                }
            }
        }

        return validMoves;
    }

    move(unitId: string, to: HexPosition): boolean {
        const unit = this.getUnit(unitId);
        if (!unit || !this.canMove(unitId) || !unit.pos) return false;

        // Validate destination
        const validMoves = this.getValidMoves(unitId);
        const isValid = validMoves.some(m => m.q === to.q && m.r === to.r);
        if (!isValid) return false;

        // Execute move
        const from = { ...unit.pos };
        const cost = hexDistance(from, to);

        unit.pos = { ...to };
        this.markMoved(unitId);

        this.emit({
            type: 'Move',
            unitId,
            from,
            to,
            cost
        });

        return true;
    }

    // ------------------------------------------------------------------------
    // Combat
    // ------------------------------------------------------------------------

    canAttack(unitId: string): boolean {
        const unit = this.getUnit(unitId);
        if (!unit || unit.isDead || !unit.pos) return false;
        if (this.hasActedThisPhase(unitId)) return false;

        const currentPhase = this.state.phase === 'HeroTurn' || this.state.phase === 'UnitsTurn' ? 'Player' : 'Enemy';
        if (unit.faction !== currentPhase) return false;

        return true;
    }

    getValidTargets(unitId: string): Unit[] {
        const unit = this.getUnit(unitId);
        if (!unit || !this.canAttack(unitId) || !unit.pos) return [];

        const enemyFaction = unit.faction === 'Player' ? 'Enemy' : 'Player';
        const enemies = this.getUnitsOfFaction(enemyFaction);

        return enemies.filter(enemy => {
            if (!enemy.pos) return false;
            const dist = hexDistance(unit.pos!, enemy.pos);
            return dist <= unit.stats.rng;
        });
    }

    attack(attackerId: string, defenderId: string): boolean {
        const attacker = this.getUnit(attackerId);
        const defender = this.getUnit(defenderId);

        if (!attacker || !defender) return false;
        if (!this.canAttack(attackerId)) return false;
        if (!attacker.pos || !defender.pos) return false;

        // Validate target
        const validTargets = this.getValidTargets(attackerId);
        if (!validTargets.find(t => t.id === defenderId)) return false;

        const dist = hexDistance(attacker.pos, defender.pos);

        this.emit({
            type: 'Attack',
            attackerId,
            defenderId,
            range: dist
        });

        // Calculate damage: ATK vs DEF
        const baseDamage = attacker.stats.atk;
        const defense = defender.stats.def;
        const damage = Math.max(1, baseDamage - Math.floor(defense * 0.5));

        // Apply damage
        defender.stats.hp = Math.max(0, defender.stats.hp - damage);

        this.emit({
            type: 'Damage',
            targetId: defenderId,
            amount: damage,
            remaining: defender.stats.hp
        });

        // Check for death
        if (defender.stats.hp <= 0 && !defender.isDead) {
            defender.isDead = true;
            this.emit({
                type: 'Death',
                unitId: defenderId,
                killedBy: attackerId
            });
        }

        this.markActed(attackerId);
        return true;
    }

    // ------------------------------------------------------------------------
    // Status effects and cooldowns
    // ------------------------------------------------------------------------

    private tickStatusEffects(): void {
        for (const unit of this.state.units) {
            if (unit.isDead) continue;

            unit.statuses = unit.statuses.filter(status => {
                status.duration--;
                if (status.duration <= 0) {
                    this.emit({
                        type: 'StatusExpired',
                        targetId: unit.id,
                        statusId: status.id
                    });
                    return false;
                }
                return true;
            });
        }
    }

    private tickCooldowns(): void {
        // Decrement commander ability cooldowns
        if (this.state.commander.runtime.cooldowns) {
            Object.keys(this.state.commander.runtime.cooldowns).forEach(abilityId => {
                const current = this.state.commander.runtime.cooldowns![abilityId];
                if (current > 0) {
                    this.state.commander.runtime.cooldowns![abilityId]--;
                }
            });
        }
    }

    // ------------------------------------------------------------------------
    // Victory conditions
    // ------------------------------------------------------------------------

    private checkBattleEnd(): boolean {
        const playerUnits = this.getUnitsOfFaction('Player');
        const enemyUnits = this.getUnitsOfFaction('Enemy');

        let winner: 'Player' | 'Enemy' | 'Draw' | null = null;

        if (playerUnits.length === 0 && enemyUnits.length === 0) {
            winner = 'Draw';
        } else if (playerUnits.length === 0) {
            winner = 'Enemy';
        } else if (enemyUnits.length === 0) {
            winner = 'Player';
        }

        if (winner) {
            this.emit({
                type: 'BattleEnd',
                winner,
                round: this.state.turn
            });

            // Update battle state
            if (winner === 'Player') {
                this.state.phase = 'Victory';
            } else {
                this.state.phase = 'Defeat';
            }

            return true;
        }

        return false;
    }

    // ------------------------------------------------------------------------
    // AI Auto-play (for testing/demo)
    // ------------------------------------------------------------------------

    runPhaseAuto(faction: 'Player' | 'Enemy'): void {
        const units = this.getUnitsOfFaction(faction);
        const enemyFaction = faction === 'Player' ? 'Enemy' : 'Player';
        const enemies = this.getUnitsOfFaction(enemyFaction);

        if (enemies.length === 0) {
            this.endPhase(faction);
            return;
        }

        for (const unit of units) {
            if (unit.isDead) continue;

            // Try to attack first if in range
            const targets = this.getValidTargets(unit.id);
            if (targets.length > 0 && !this.hasActedThisPhase(unit.id)) {
                // Attack nearest enemy
                const nearest = this.findNearestEnemy(unit, targets);
                if (nearest) {
                    this.attack(unit.id, nearest.id);
                }
            }

            // Try to move if haven't moved yet
            if (!this.hasMovedThisPhase(unit.id) && unit.pos) {
                const moveTarget = this.findMoveTowardEnemy(unit, enemies);
                if (moveTarget) {
                    this.move(unit.id, moveTarget);

                    // After moving, check if now in attack range
                    const newTargets = this.getValidTargets(unit.id);
                    if (newTargets.length > 0 && !this.hasActedThisPhase(unit.id)) {
                        const nearest = this.findNearestEnemy(unit, newTargets);
                        if (nearest) {
                            this.attack(unit.id, nearest.id);
                        }
                    }
                }
            }
        }

        this.endPhase(faction);
    }

    private findNearestEnemy(unit: Unit, candidates: Unit[]): Unit | null {
        if (!unit.pos) return null;

        let nearest: Unit | null = null;
        let minDist = Infinity;

        for (const enemy of candidates) {
            if (!enemy.pos) continue;
            const dist = hexDistance(unit.pos, enemy.pos);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    private findMoveTowardEnemy(unit: Unit, enemies: Unit[]): HexPosition | null {
        if (!unit.pos) return null;

        const nearest = this.findNearestEnemy(unit, enemies);
        if (!nearest || !nearest.pos) return null;

        const validMoves = this.getValidMoves(unit.id);
        if (validMoves.length === 0) return null;

        // Pick move that gets closest to nearest enemy
        let best: HexPosition | null = null;
        let bestDist = Infinity;

        for (const move of validMoves) {
            const dist = hexDistance(move, nearest.pos);
            if (dist < bestDist) {
                bestDist = dist;
                best = move;
            }
        }

        return best;
    }
}
