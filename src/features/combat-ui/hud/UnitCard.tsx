/**
 * Unit Card Component - World Engine Combat UI
 * Displays selected unit stats, morale, and status effects
 */

import React from 'react';
import type { Unit } from '../../battle/types';

interface UnitCardProps {
    unit?: Unit;
    archetype?: 'knight' | 'ranger' | 'chanter' | 'mystic' | 'guardian' | 'corsair';
    species?: 'human' | 'sylvanborn' | 'nightborn' | 'stormcaller';
    className?: string;
}

interface StatBarProps {
    label: string;
    current: number;
    max: number;
    color: string;
    icon?: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, current, max, _color, icon }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    const isLow = percentage < 25;
    const isCritical = percentage < 10;

    return (
        <div className={`stat-bar ${isLow ? 'stat-bar--low' : ''} ${isCritical ? 'stat-bar--critical' : ''}`}>
            <div className="stat-bar__header">
                <span className="stat-bar__label">
                    {icon && <span className="stat-bar__icon">{icon}</span>}
                    {label}
                </span>
                <span className="stat-bar__value">
                    {current}/{max}
                </span>
            </div>
            <div className="stat-bar__track">
                <div
                    className="stat-bar__fill"
                    style={{
                        width: `${Math.max(0, Math.min(100, percentage))}%`,
                        backgroundColor: color
                    }}
                />
            </div>
        </div>
    );
};

interface MoraleBadgeProps {
    morale: number;
    className?: string;
}

const MoraleBadge: React.FC<MoraleBadgeProps> = ({ morale, className = '' }) => {
    const getMoraleStatus = (morale: number) => {
        if (morale >= 80) return { status: 'Steadfast', color: '#38a169', icon: '💪' };
        if (morale >= 60) return { status: 'Confident', color: '#319795', icon: '😊' };
        if (morale >= 40) return { status: 'Steady', color: '#d69e2e', icon: '😐' };
        if (morale >= 20) return { status: 'Shaken', color: '#e53e3e', icon: '😰' };
        return { status: 'Routing', color: '#9b2c2c', icon: '😱' };
    };

    const { status, _color, icon } = getMoraleStatus(morale);

    return (
        <div className={`morale-badge morale-badge--${status.toLowerCase()} ${className}`}>
            <div className="morale-badge__icon">{icon}</div>
            <div className="morale-badge__status">{status}</div>
            <div className="morale-badge__value">{morale}</div>
        </div>
    );
};

interface StatusChipProps {
    status: {
        id: string;
        name: string;
        duration?: number;
        type?: 'buff' | 'debuff' | 'neutral';
    };
}const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
    const getStatusIcon = (statusId: string) => {
        const icons: Record<string, string> = {
            poisoned: '🤢',
            blessed: '✨',
            shielded: '🛡️',
            hasted: '💨',
            slowed: '🐌',
            burning: '🔥',
            frozen: '❄️',
            stunned: '💫',
            invisible: '👻',
            strengthened: '💪',
            weakened: '😵',
            regenerating: '💚'
        };
        return icons[statusId] || '❓';
    };

    // Determine status type based on effects if not provided
    const statusType = status.type || 'neutral';

    return (
        <div className={`status-chip status-chip--${statusType}`} title={status.name}>
            <span className="status-chip__icon">{getStatusIcon(status.id)}</span>
            <span className="status-chip__name">{status.name}</span>
            {status.duration && (
                <span className="status-chip__duration">{status.duration}</span>
            )}
        </div>
    );
};

export const UnitCard: React.FC<UnitCardProps> = ({
    unit,
    archetype,
    species,
    className = ''
}) => {
    if (!unit) {
        return (
            <div className={`unit-card unit-card--empty ${className}`}>
                <div className="unit-card__message">
                    No unit selected
                </div>
            </div>
        );
    }

    // Extract unit data (would come from actual Unit object)
    const unitData = {
        name: unit.id || 'Unknown Unit',
        archetype: archetype || 'knight',
        species: species || 'human',
        level: unit.level || 1,
        hp: unit.stats?.hp || 100,
        maxHp: unit.stats?.maxHp || 100,
        stamina: unit.stamina || 50,
        maxStamina: 100, // Could be calculated based on CON
        move: unit.stats?.move || 3,
        maxMove: unit.stats?.move || 3,
        morale: unit.morale || 75,
        statuses: unit.statuses || []
    };

    const getPortraitUrl = (species: string, archetype: string) => {
        // This would integrate with the portrait system
        return `/assets/portraits-new/${species}/${archetype}.png`;
    };

    const getSpeciesDisplayName = (species: string) => {
        const names: Record<string, string> = {
            human: 'Human',
            sylvanborn: 'Sylvanborn',
            nightborn: 'Nightborn',
            stormcaller: 'Stormcaller'
        };
        return names[species] || species;
    };

    const getArchetypeDisplayName = (archetype: string) => {
        return archetype.charAt(0).toUpperCase() + archetype.slice(1);
    };

    return (
        <div className={`unit-card unit-card--${archetype} ${className}`}>
            <div className="unit-card__header">
                <div className="unit-card__portrait">
                    <img
                        src={getPortraitUrl(unitData.species, unitData.archetype)}
                        alt={`${unitData.species} ${unitData.archetype}`}
                        className="unit-card__portrait-img"
                        onError={(e) => {
                            // Fallback to placeholder
                            (e.target as HTMLImageElement).src = '/assets/portraits-new/placeholder.png';
                        }}
                    />
                    <div className="unit-card__level">{unitData.level}</div>
                </div>

                <div className="unit-card__info">
                    <div className="unit-card__name">{unitData.name}</div>
                    <div className="unit-card__class">
                        {getArchetypeDisplayName(unitData.archetype)}
                    </div>
                    <div className="unit-card__species">
                        {getSpeciesDisplayName(unitData.species)}
                    </div>
                </div>

                <MoraleBadge morale={unitData.morale} />
            </div>

            <div className="unit-card__stats">
                <StatBar
                    label="Health"
                    current={unitData.hp}
                    max={unitData.maxHp}
                    color="#e53e3e"
                    icon="❤️"
                />
                <StatBar
                    label="Stamina"
                    current={unitData.stamina}
                    max={unitData.maxStamina}
                    color="#3182ce"
                    icon="✨"
                />
                <StatBar
                    label="Movement"
                    current={unitData.move}
                    max={unitData.maxMove}
                    color="#38a169"
                    icon="⚡"
                />
            </div>            {unitData.statuses && unitData.statuses.length > 0 && (
                <div className="unit-card__statuses">
                    <div className="unit-card__statuses-header">Status Effects</div>
                    <div className="unit-card__statuses-list">
                        {unitData.statuses.map((status, index) => (
                            <StatusChip key={`${status.id}_${index}`} status={status} />
                        ))}
                    </div>
                </div>
            )}

            <div className="unit-card__quick-stats">
                <div className="quick-stat">
                    <span className="quick-stat__label">ATK</span>
                    <span className="quick-stat__value">{unit.stats?.atk || 10}</span>
                </div>
                <div className="quick-stat">
                    <span className="quick-stat__label">DEF</span>
                    <span className="quick-stat__value">{unit.stats?.def || 10}</span>
                </div>
                <div className="quick-stat">
                    <span className="quick-stat__label">MAG</span>
                    <span className="quick-stat__value">{unit.stats?.mag || 10}</span>
                </div>
                <div className="quick-stat">
                    <span className="quick-stat__label">SPD</span>
                    <span className="quick-stat__value">{unit.stats?.spd || 10}</span>
                </div>
            </div>
        </div>
    );
};