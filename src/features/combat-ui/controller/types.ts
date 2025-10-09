/**
 * Combat UI Controller Types - World Engine Combat Interface
 * Adapted for World Engine's 6 archetypes and tactical combat system
 */

import type { HexPosition } from '../../battle/types';

export type CombatMode = 'idle' | 'inspect' | 'move' | 'attack' | 'cast' | 'command' | 'rally' | 'flee' | 'confirm';

export interface WorldEngineAbility {
    kind: 'attack' | 'spell' | 'command' | 'rally' | 'move' | 'flee';
    id?: string;
    name: string;
    range?: number;
    apCost: number;
    manaCost?: number;
    archetype?: 'knight' | 'ranger' | 'chanter' | 'mystic' | 'guardian' | 'corsair'; // World Engine archetypes
}export interface SelectionState {
    mode: CombatMode;
    actor?: string;               // unit id
    ability?: WorldEngineAbility;
    origin?: HexPosition;         // actor pos cached
    targetHex?: HexPosition;      // single target
    aoe?: HexPosition[];          // selected area for spells/abilities
    path?: HexPosition[];         // for move/flee
    reasons?: string[];           // last validation failures
    archetype?: 'knight' | 'ranger' | 'chanter' | 'mystic' | 'guardian' | 'corsair';
}

export interface SelectionAPI {
    get(): SelectionState;
    reset(next?: Partial<SelectionState>): void;
    setMode(m: CombatMode): void;
    setTarget(h: HexPosition | undefined): void;
    setPath(p: HexPosition[] | undefined): void;
    setAbility(ability: WorldEngineAbility | undefined): void;
}

export interface InputMap {
    primary: 'MouseLeft' | 'Tap';
    secondary: 'MouseRight' | 'TwoFingerTap' | 'Back';
    pan: 'MiddleDrag' | 'TwoFingerDrag';
    zoom: 'Wheel' | 'Pinch';
    hotkeys: Record<string, CombatMode>; // Q:attack, W:cast, E:move, R:rally, F:flee, D:defend, T:wait
}

// World Engine archetype-specific abilities
export const ARCHETYPE_ABILITIES: Record<string, WorldEngineAbility[]> = {
    knight: [
        { kind: 'attack', name: 'Shield Bash', range: 1, apCost: 2, id: 'shield_bash' },
        { kind: 'command', name: 'Hold the Line', range: 2, apCost: 3, id: 'hold_line' },
        { kind: 'rally', name: 'Inspiring Presence', range: 3, apCost: 2, id: 'inspire' }
    ],
    ranger: [
        { kind: 'attack', name: 'Aimed Shot', range: 4, apCost: 2, id: 'aimed_shot' },
        { kind: 'spell', name: 'Hunter\'s Mark', range: 5, apCost: 1, manaCost: 10, id: 'hunters_mark' },
        { kind: 'command', name: 'Coordinated Strike', range: 3, apCost: 3, id: 'coord_strike' }
    ],
    chanter: [
        { kind: 'spell', name: 'Healing Light', range: 3, apCost: 2, manaCost: 15, id: 'heal_light' },
        { kind: 'rally', name: 'Battle Hymn', range: 4, apCost: 3, manaCost: 20, id: 'battle_hymn' },
        { kind: 'spell', name: 'Divine Shield', range: 2, apCost: 2, manaCost: 12, id: 'divine_shield' }
    ],
    mystic: [
        { kind: 'spell', name: 'Arcane Bolt', range: 4, apCost: 2, manaCost: 8, id: 'arcane_bolt' },
        { kind: 'spell', name: 'Teleport', range: 6, apCost: 3, manaCost: 25, id: 'teleport' },
        { kind: 'spell', name: 'Mana Shield', range: 0, apCost: 1, manaCost: 10, id: 'mana_shield' }
    ],
    guardian: [
        { kind: 'spell', name: 'Nature\'s Wrath', range: 3, apCost: 3, manaCost: 20, id: 'natures_wrath' },
        { kind: 'spell', name: 'Healing Springs', range: 2, apCost: 2, manaCost: 15, id: 'heal_springs' },
        { kind: 'command', name: 'Natural Barrier', range: 2, apCost: 4, manaCost: 18, id: 'barrier' }
    ],
    corsair: [
        { kind: 'attack', name: 'Backstab', range: 1, apCost: 2, id: 'backstab' },
        { kind: 'attack', name: 'Throwing Knives', range: 3, apCost: 2, id: 'throw_knives' },
        { kind: 'command', name: 'Smoke Bomb', range: 1, apCost: 3, id: 'smoke_bomb' }
    ]
};

export const DEFAULT_INPUT_MAP: InputMap = {
    primary: 'MouseLeft',
    secondary: 'MouseRight',
    pan: 'MiddleDrag',
    zoom: 'Wheel',
    hotkeys: {
        'q': 'attack',
        'w': 'cast',
        'e': 'move',
        'r': 'rally',
        'f': 'flee',
        'd': 'idle', // defend/wait
        't': 'idle', // wait/pass turn
        'Escape': 'idle',
        'Enter': 'confirm',
        ' ': 'confirm' // spacebar
    }
};