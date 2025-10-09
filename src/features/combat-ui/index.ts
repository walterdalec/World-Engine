/**
 * Combat UI System - World Engine
 * Complete tactical combat interface with World Engine integration
 * 
 * Features:
 * - Archetype-specific action bars (knight, ranger, chanter, mystic, guardian, corsair)
 * - Unit cards with morale and status effects
 * - Turn queue with initiative tracking
 * - Combat log with filtering
 * - Selection state management
 * - Input handling for mouse/keyboard/touch
 */

// Controller exports
export { SelectionManager } from './controller/Selection';
export type { InputController } from './controller/Input';
export type {
    CombatMode,
    WorldEngineAbility,
    SelectionState
} from './controller/types';

// HUD Component exports
export {
    ActionBar,
    UnitCard,
    TurnQueue,
    LogPanel,
    type LogEntry
} from './hud';