/**
 * Turn Queue Component - World Engine Combat UI
 * Displays initiative order and current turn status
 */

import React from 'react';
import type { Unit } from '../../battle/types';

interface TurnQueueProps {
    units: Unit[];
    initiative: string[];
    currentTurn?: string;
    phase: 'Setup' | 'HeroTurn' | 'UnitsTurn' | 'EnemyTurn' | 'Victory' | 'Defeat';
    onUnitSelect?: (_unitId: string) => void;
    className?: string;
}

interface QueueEntryProps {
    unit: Unit;
    isActive: boolean;
    isUpcoming: boolean;
    isPast: boolean;
    onClick?: () => void;
}

const QueueEntry: React.FC<QueueEntryProps> = ({
    unit,
    isActive,
    isUpcoming,
    isPast,
    onClick
}) => {
    const getArchetypeIcon = (archetype: string) => {
        const icons: Record<string, string> = {
            knight: '⚔️',
            ranger: '🏹',
            chanter: '📜',
            mystic: '🔮',
            guardian: '🛡️',
            corsair: '🗡️'
        };
        return icons[archetype] || '👤';
    };

    const getFactionColor = (faction: string) => {
        return faction === 'Player' ? '#38a169' : '#e53e3e';
    };

    const getStatusIndicator = (unit: Unit) => {
        if (unit.isDead) return '💀';
        if (unit.morale && unit.morale < 30) return '😰';
        if (unit.statuses && unit.statuses.length > 0) {
            // Show most important status
            const importantStatuses = ['stunned', 'poisoned', 'burning', 'frozen'];
            const status = unit.statuses.find(s => importantStatuses.includes(s.id));
            if (status) {
                const statusIcons: Record<string, string> = {
                    stunned: '💫',
                    poisoned: '🤢',
                    burning: '🔥',
                    frozen: '❄️'
                };
                return statusIcons[status.id] || '❓';
            }
        }
        return null;
    };

    return (
        <div
            className={`
        queue-entry 
        ${isActive ? 'queue-entry--active' : ''} 
        ${isUpcoming ? 'queue-entry--upcoming' : ''} 
        ${isPast ? 'queue-entry--past' : ''}
        ${unit.faction === 'Player' ? 'queue-entry--player' : 'queue-entry--enemy'}
        ${unit.isDead ? 'queue-entry--dead' : ''}
        ${onClick ? 'queue-entry--clickable' : ''}
      `}
            onClick={onClick}
            title={`${unit.name} (${unit.archetype})`}
        >
            <div className="queue-entry__portrait">
                <div
                    className="queue-entry__archetype-icon"
                    style={{ color: getFactionColor(unit.faction) }}
                >
                    {getArchetypeIcon(unit.archetype)}
                </div>
                {unit.isDead && (
                    <div className="queue-entry__death-overlay">💀</div>
                )}
            </div>

            <div className="queue-entry__info">
                <div className="queue-entry__name">{unit.name}</div>
                <div className="queue-entry__speed">SPD {unit.stats?.spd || 0}</div>
            </div>

            <div className="queue-entry__status">
                {getStatusIndicator(unit) && (
                    <div className="queue-entry__status-icon">
                        {getStatusIndicator(unit)}
                    </div>
                )}

                <div className="queue-entry__hp">
                    <div
                        className="queue-entry__hp-bar"
                        style={{
                            width: `${Math.max(0, Math.min(100, (unit.stats?.hp || 0) / (unit.stats?.maxHp || 1) * 100))}%`,
                            backgroundColor: unit.faction === 'Player' ? '#38a169' : '#e53e3e'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

interface PhaseIndicatorProps {
    phase: 'Setup' | 'HeroTurn' | 'UnitsTurn' | 'EnemyTurn' | 'Victory' | 'Defeat';
    turnNumber?: number;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ phase, turnNumber = 1 }) => {
    const getPhaseDisplay = (phase: string) => {
        switch (phase) {
            case 'Setup': return { text: 'Deployment', icon: '🎯', color: '#d69e2e' };
            case 'HeroTurn': return { text: 'Hero Command', icon: '👑', color: '#3182ce' };
            case 'UnitsTurn': return { text: 'Player Turn', icon: '⚔️', color: '#38a169' };
            case 'EnemyTurn': return { text: 'Enemy Turn', icon: '🗡️', color: '#e53e3e' };
            case 'Victory': return { text: 'Victory!', icon: '🏆', color: '#38a169' };
            case 'Defeat': return { text: 'Defeat', icon: '💔', color: '#e53e3e' };
            default: return { text: 'Unknown', icon: '❓', color: '#718096' };
        }
    };

    const { text, icon, color } = getPhaseDisplay(phase);

    return (
        <div className="phase-indicator" style={{ borderColor: color }}>
            <div className="phase-indicator__icon" style={{ color }}>
                {icon}
            </div>
            <div className="phase-indicator__text">
                <div className="phase-indicator__phase" style={{ color }}>
                    {text}
                </div>
                {phase !== 'Setup' && phase !== 'Victory' && phase !== 'Defeat' && (
                    <div className="phase-indicator__turn">
                        Turn {turnNumber}
                    </div>
                )}
            </div>
        </div>
    );
};

export const TurnQueue: React.FC<TurnQueueProps> = ({
    units,
    initiative,
    currentTurn,
    phase,
    onUnitSelect,
    className = ''
}) => {
    // Create ordered list based on initiative
    const orderedUnits = initiative
        .map(id => units.find(unit => unit.id === id))
        .filter((unit): unit is Unit => unit !== undefined);

    const currentTurnIndex = currentTurn ? initiative.indexOf(currentTurn) : -1;

    const handleUnitClick = (unit: Unit) => {
        if (onUnitSelect && !unit.isDead && unit.faction === 'Player') {
            onUnitSelect(unit.id);
        }
    };

    return (
        <div className={`turn-queue ${className}`}>
            <div className="turn-queue__header">
                <PhaseIndicator phase={phase} turnNumber={Math.floor(currentTurnIndex / orderedUnits.length) + 1} />
            </div>

            <div className="turn-queue__list">
                <div className="turn-queue__section-header">Initiative Order</div>

                {orderedUnits.map((unit, index) => {
                    const isActive = currentTurn === unit.id;
                    const isUpcoming = index > currentTurnIndex && !isActive;
                    const isPast = index < currentTurnIndex;

                    return (
                        <QueueEntry
                            key={unit.id}
                            unit={unit}
                            isActive={isActive}
                            isUpcoming={isUpcoming}
                            isPast={isPast}
                            onClick={() => handleUnitClick(unit)}
                        />
                    );
                })}

                {orderedUnits.length === 0 && (
                    <div className="turn-queue__empty">
                        No units in battle
                    </div>
                )}
            </div>

            <div className="turn-queue__summary">
                <div className="turn-queue__stats">
                    <div className="queue-stat">
                        <span className="queue-stat__label">Player Units</span>
                        <span className="queue-stat__value">
                            {units.filter(u => u.faction === 'Player' && !u.isDead).length}/
                            {units.filter(u => u.faction === 'Player').length}
                        </span>
                    </div>
                    <div className="queue-stat">
                        <span className="queue-stat__label">Enemy Units</span>
                        <span className="queue-stat__value">
                            {units.filter(u => u.faction === 'Enemy' && !u.isDead).length}/
                            {units.filter(u => u.faction === 'Enemy').length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};