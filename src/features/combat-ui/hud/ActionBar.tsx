/**
 * Action Bar Component - World Engine Combat UI
 * Context-sensitive action buttons for each archetype's abilities
 */

import React, { useMemo } from 'react';
import type { WorldEngineAbility } from '../controller/types';
import { ARCHETYPE_ABILITIES } from '../controller/types';
import { selectionManager } from '../controller/Selection';

interface ActionBarProps {
    archetype?: 'knight' | 'ranger' | 'chanter' | 'mystic' | 'guardian' | 'corsair';
    currentAP?: number;
    currentMana?: number;
    disabled?: boolean;
    className?: string;
}

interface ActionButtonProps {
    ability: WorldEngineAbility;
    available: boolean;
    active: boolean;
    onClick: () => void;
    hotkey?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
    ability,
    available,
    active,
    onClick,
    hotkey
}) => {
    const buttonClass = [
        'action-button',
        active ? 'action-button--active' : '',
        !available ? 'action-button--disabled' : '',
        `action-button--${ability.kind}`
    ].filter(Boolean).join(' ');

    const costText = useMemo(() => {
        const costs = [];
        if (ability.apCost > 0) costs.push(`${ability.apCost} AP`);
        if (ability.manaCost && ability.manaCost > 0) costs.push(`${ability.manaCost} MP`);
        return costs.join(', ');
    }, [ability.apCost, ability.manaCost]);

    return (
        <button
            className={buttonClass}
            onClick={onClick}
            disabled={!available}
            title={`${ability.name}${costText ? ` (${costText})` : ''}${hotkey ? ` [${hotkey.toUpperCase()}]` : ''}`}
        >
            <div className="action-button__icon">
                {getAbilityIcon(ability.kind, ability.id)}
            </div>
            <div className="action-button__label">
                {ability.name}
            </div>
            {hotkey && (
                <div className="action-button__hotkey">
                    {hotkey.toUpperCase()}
                </div>
            )}
            {costText && (
                <div className="action-button__cost">
                    {costText}
                </div>
            )}
        </button>
    );
};

export const ActionBar: React.FC<ActionBarProps> = ({
    archetype,
    currentAP = 0,
    currentMana = 0,
    disabled = false,
    className = ''
}) => {
    const state = selectionManager.get();

    const availableAbilities = useMemo(() => {
        if (!archetype) return [];
        return ARCHETYPE_ABILITIES[archetype] || [];
    }, [archetype]);

    const baseActions = useMemo(() => [
        { kind: 'attack' as const, name: 'Attack', range: 1, apCost: 2, id: 'basic_attack' },
        { kind: 'move' as const, name: 'Move', range: 0, apCost: 1, id: 'move' },
        { kind: 'rally' as const, name: 'Rally', range: 2, apCost: 3, id: 'basic_rally' },
        { kind: 'flee' as const, name: 'Flee', range: 0, apCost: 2, id: 'flee' }
    ] as WorldEngineAbility[], []);

    const allActions = useMemo(() => {
        return [...baseActions, ...availableAbilities];
    }, [baseActions, availableAbilities]);

    const handleActionClick = (ability: WorldEngineAbility) => {
        if (disabled) return;

        selectionManager.setAbility(ability);
    };

    const isAbilityAvailable = (ability: WorldEngineAbility): boolean => {
        if (disabled) return false;
        if (ability.apCost > currentAP) return false;
        if (ability.manaCost && ability.manaCost > currentMana) return false;
        return true;
    };

    const isAbilityActive = (ability: WorldEngineAbility): boolean => {
        return state.ability?.id === ability.id;
    };

    const getHotkey = (ability: WorldEngineAbility): string | undefined => {
        switch (ability.id) {
            case 'basic_attack': return 'q';
            case 'move': return 'e';
            case 'basic_rally': return 'r';
            case 'flee': return 'f';
            default:
                switch (ability.kind) {
                    case 'attack': return 'q';
                    case 'spell': return 'w';
                    case 'rally': return 'r';
                    default: return undefined;
                }
        }
    };

    if (!archetype || allActions.length === 0) {
        return (
            <div className={`action-bar action-bar--empty ${className}`}>
                <div className="action-bar__message">
                    Select a unit to see available actions
                </div>
            </div>
        );
    }

    return (
        <div className={`action-bar action-bar--${archetype} ${className}`}>
            <div className="action-bar__header">
                <div className="action-bar__title">
                    {archetype.charAt(0).toUpperCase() + archetype.slice(1)} Actions
                </div>
                <div className="action-bar__resources">
                    <span className="resource resource--ap">{currentAP} AP</span>
                    <span className="resource resource--mana">{currentMana} MP</span>
                </div>
            </div>

            <div className="action-bar__actions">
                {allActions.map((ability, index) => (
                    <ActionButton
                        key={ability.id || `${ability.kind}_${index}`}
                        ability={ability}
                        available={isAbilityAvailable(ability)}
                        active={isAbilityActive(ability)}
                        onClick={() => handleActionClick(ability)}
                        hotkey={getHotkey(ability)}
                    />
                ))}
            </div>

            <div className="action-bar__help">
                <div className="help-text">
                    Use hotkeys: Q (Attack), W (Cast), E (Move), R (Rally), F (Flee)
                </div>
            </div>
        </div>
    );
};

// Utility function to get appropriate icons for abilities
function getAbilityIcon(kind: string, id?: string): string {
    // These would be replaced with actual icon components or Unicode symbols
    switch (kind) {
        case 'attack':
            return '⚔️';
        case 'spell':
            return '✨';
        case 'command':
            return '🛡️';
        case 'rally':
            return '📯';
        case 'move':
            return '🏃';
        case 'flee':
            return '💨';
        default:
            return '❓';
    }
}

// Archetype-specific color themes
export const ARCHETYPE_THEMES = {
    knight: {
        primary: '#4a5568',   // Steel gray
        secondary: '#2d3748', // Dark gray
        accent: '#ed8936'     // Bronze
    },
    ranger: {
        primary: '#38a169',   // Forest green
        secondary: '#2f855a', // Dark green
        accent: '#68d391'     // Light green
    },
    chanter: {
        primary: '#d69e2e',   // Gold
        secondary: '#b7791f', // Dark gold
        accent: '#f6e05e'     // Light yellow
    },
    mystic: {
        primary: '#805ad5',   // Purple
        secondary: '#6b46c1', // Dark purple
        accent: '#b794f6'     // Light purple
    },
    guardian: {
        primary: '#319795',   // Teal
        secondary: '#2c7a7b', // Dark teal
        accent: '#81e6d9'     // Light teal
    },
    corsair: {
        primary: '#e53e3e',   // Red
        secondary: '#c53030', // Dark red
        accent: '#fc8181'     // Light red
    }
};