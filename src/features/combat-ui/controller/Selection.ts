/**
 * Selection State Machine - World Engine Combat UI
 * Manages combat mode transitions and target selection
 */

import type {
    SelectionState,
    SelectionAPI,
    CombatMode,
    WorldEngineAbility
} from './types';
import type { HexPosition } from '../../battle/types';

class SelectionManager implements SelectionAPI {
    private state: SelectionState = {
        mode: 'idle'
    };

    private listeners: Array<(state: SelectionState) => void> = [];

    constructor() {
        this.reset();
    }

    get(): SelectionState {
        return { ...this.state };
    }

    reset(next?: Partial<SelectionState>): void {
        this.state = {
            mode: 'idle',
            actor: undefined,
            ability: undefined,
            origin: undefined,
            targetHex: undefined,
            aoe: undefined,
            path: undefined,
            reasons: undefined,
            archetype: undefined,
            ...next
        };
        this.notifyListeners();
    }

    setMode(mode: CombatMode): void {
        const prevMode = this.state.mode;
        this.state.mode = mode;

        // Mode transition logic
        if (mode === 'idle') {
            this.state.targetHex = undefined;
            this.state.aoe = undefined;
            this.state.path = undefined;
            this.state.ability = undefined;
            this.state.reasons = undefined;
        } else if (mode === 'inspect') {
            // Keep current selection but clear actions
            this.state.targetHex = undefined;
            this.state.aoe = undefined;
            this.state.path = undefined;
            this.state.ability = undefined;
        } else if (mode === 'confirm') {
            // Validate we have everything needed for confirmation
            if (!this.state.actor) {
                this.state.mode = 'idle';
                this.state.reasons = ['No unit selected'];
            }
        }

        // Clear incompatible state when switching action modes
        if (prevMode !== mode && ['move', 'attack', 'cast', 'command', 'rally', 'flee'].includes(mode)) {
            this.state.targetHex = undefined;
            this.state.aoe = undefined;
            this.state.path = undefined;
            this.state.reasons = undefined;
        }

        this.notifyListeners();
    }

    setTarget(hex: HexPosition | undefined): void {
        this.state.targetHex = hex;

        // Auto-transition to confirm if we have a valid target for current mode
        if (hex && this.state.mode !== 'idle' && this.state.mode !== 'inspect') {
            if (['attack', 'cast', 'command', 'rally'].includes(this.state.mode)) {
                this.state.mode = 'confirm';
            }
        }

        this.notifyListeners();
    }

    setPath(path: HexPosition[] | undefined): void {
        this.state.path = path;

        // Auto-transition to confirm if we have a valid path for movement
        if (path && path.length > 0 && ['move', 'flee'].includes(this.state.mode)) {
            this.state.mode = 'confirm';
        }

        this.notifyListeners();
    }

    setAbility(ability: WorldEngineAbility | undefined): void {
        this.state.ability = ability;

        // Set appropriate mode based on ability type
        if (ability) {
            switch (ability.kind) {
                case 'attack':
                    this.state.mode = 'attack';
                    break;
                case 'spell':
                    this.state.mode = 'cast';
                    break;
                case 'command':
                    this.state.mode = 'command';
                    break;
                case 'rally':
                    this.state.mode = 'rally';
                    break;
            }
        }

        this.notifyListeners();
    }

    setActor(unitId: string | undefined, archetype?: 'knight' | 'ranger' | 'chanter' | 'mystic' | 'guardian' | 'corsair'): void {
        this.state.actor = unitId;
        this.state.archetype = archetype;

        if (unitId) {
            this.state.mode = 'inspect';
        } else {
            this.state.mode = 'idle';
        }

        // Clear action-specific state when changing actors
        this.state.targetHex = undefined;
        this.state.aoe = undefined;
        this.state.path = undefined;
        this.state.ability = undefined;
        this.state.reasons = undefined;

        this.notifyListeners();
    }

    setOrigin(pos: HexPosition | undefined): void {
        this.state.origin = pos;
        this.notifyListeners();
    }

    setAOE(hexes: HexPosition[] | undefined): void {
        this.state.aoe = hexes;
        this.notifyListeners();
    }

    setReasons(reasons: string[] | undefined): void {
        this.state.reasons = reasons;
        this.notifyListeners();
    }

    // Event system for UI updates
    subscribe(listener: (state: SelectionState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index >= 0) {
                this.listeners.splice(index, 1);
            }
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.get()));
    }

    // Utility methods for state queries
    isInActionMode(): boolean {
        return ['move', 'attack', 'cast', 'command', 'rally', 'flee'].includes(this.state.mode);
    }

    isTargeting(): boolean {
        return ['attack', 'cast', 'command', 'rally'].includes(this.state.mode);
    }

    isMoving(): boolean {
        return ['move', 'flee'].includes(this.state.mode);
    }

    canConfirm(): boolean {
        if (this.state.mode !== 'confirm') return false;
        if (!this.state.actor) return false;

        if (this.isTargeting()) {
            return !!this.state.targetHex || !!(this.state.aoe && this.state.aoe.length > 0);
        }

        if (this.isMoving()) {
            return !!(this.state.path && this.state.path.length > 0);
        }

        return false;
    }
}

// Singleton instance
export const selectionManager = new SelectionManager();

// Export the API
export type { SelectionAPI };
export { SelectionManager };