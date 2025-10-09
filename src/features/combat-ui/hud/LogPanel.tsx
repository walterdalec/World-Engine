/**
 * Log Panel Component - World Engine Combat UI
 * Displays combat log with filtering and auto-scroll
 */

import React, { useState, useRef, useEffect } from 'react';

export interface LogEntry {
    id: string;
    timestamp: number;
    type: 'move' | 'attack' | 'spell' | 'damage' | 'heal' | 'status' | 'death' | 'command' | 'system';
    source?: string; // Unit name or system
    target?: string; // Target unit name
    message: string;
    details?: {
        damage?: number;
        healing?: number;
        statusId?: string;
        ability?: string;
        [key: string]: any;
    };
}

interface LogPanelProps {
    entries: LogEntry[];
    maxEntries?: number;
    autoScroll?: boolean;
    showFilters?: boolean;
    className?: string;
}

interface LogFilterProps {
    activeFilters: Set<string>;
    onFilterChange: (filters: Set<string>) => void;
}

const LogFilter: React.FC<LogFilterProps> = ({ activeFilters, onFilterChange }) => {
    const filterOptions = [
        { id: 'all', label: 'All', icon: '📋' },
        { id: 'move', label: 'Movement', icon: '👣' },
        { id: 'attack', label: 'Attacks', icon: '⚔️' },
        { id: 'spell', label: 'Spells', icon: '✨' },
        { id: 'damage', label: 'Damage', icon: '💥' },
        { id: 'heal', label: 'Healing', icon: '💚' },
        { id: 'status', label: 'Status', icon: '🎭' },
        { id: 'death', label: 'Deaths', icon: '💀' },
        { id: 'command', label: 'Commands', icon: '👑' },
        { id: 'system', label: 'System', icon: '⚙️' }
    ];

    const handleFilterClick = (filterId: string) => {
        const newFilters = new Set(activeFilters);

        if (filterId === 'all') {
            newFilters.clear();
            newFilters.add('all');
        } else {
            newFilters.delete('all');
            if (newFilters.has(filterId)) {
                newFilters.delete(filterId);
            } else {
                newFilters.add(filterId);
            }

            // If no specific filters, default to 'all'
            if (newFilters.size === 0) {
                newFilters.add('all');
            }
        }

        onFilterChange(newFilters);
    };

    return (
        <div className="log-filter">
            <div className="log-filter__label">Filters:</div>
            <div className="log-filter__options">
                {filterOptions.map(option => (
                    <button
                        key={option.id}
                        className={`
              log-filter__option 
              ${activeFilters.has(option.id) ? 'log-filter__option--active' : ''}
            `}
                        onClick={() => handleFilterClick(option.id)}
                        title={option.label}
                    >
                        <span className="log-filter__icon">{option.icon}</span>
                        <span className="log-filter__text">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

interface LogEntryComponentProps {
    entry: LogEntry;
    isLatest?: boolean;
}

const LogEntryComponent: React.FC<LogEntryComponentProps> = ({ entry, isLatest = false }) => {
    const getEntryIcon = (type: string) => {
        const icons: Record<string, string> = {
            move: '👣',
            attack: '⚔️',
            spell: '✨',
            damage: '💥',
            heal: '💚',
            status: '🎭',
            death: '💀',
            command: '👑',
            system: '⚙️'
        };
        return icons[type] || '📝';
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            move: '#718096',
            attack: '#e53e3e',
            spell: '#9f7aea',
            damage: '#e53e3e',
            heal: '#38a169',
            status: '#d69e2e',
            death: '#9b2c2c',
            command: '#3182ce',
            system: '#4a5568'
        };
        return colors[type] || '#718096';
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 1
        });
    };

    const formatMessage = (entry: LogEntry) => {
        let message = entry.message;

        // Add damage/healing numbers if available
        if (entry.details?.damage) {
            message += ` (${entry.details.damage} damage)`;
        }
        if (entry.details?.healing) {
            message += ` (${entry.details.healing} healing)`;
        }

        return message;
    };

    return (
        <div
            className={`
        log-entry 
        log-entry--${entry.type}
        ${isLatest ? 'log-entry--latest' : ''}
      `}
        >
            <div className="log-entry__timestamp">
                {formatTime(entry.timestamp)}
            </div>

            <div
                className="log-entry__icon"
                style={{ color: getTypeColor(entry.type) }}
            >
                {getEntryIcon(entry.type)}
            </div>

            <div className="log-entry__content">
                <div className="log-entry__message">
                    {formatMessage(entry)}
                </div>

                {(entry.source || entry.target) && (
                    <div className="log-entry__participants">
                        {entry.source && (
                            <span className="log-entry__source">{entry.source}</span>
                        )}
                        {entry.source && entry.target && (
                            <span className="log-entry__arrow"> → </span>
                        )}
                        {entry.target && (
                            <span className="log-entry__target">{entry.target}</span>
                        )}
                    </div>
                )}

                {entry.details?.ability && (
                    <div className="log-entry__ability">
                        using {entry.details.ability}
                    </div>
                )}
            </div>
        </div>
    );
};

export const LogPanel: React.FC<LogPanelProps> = ({
    entries,
    maxEntries = 100,
    autoScroll = true,
    showFilters = true,
    className = ''
}) => {
    const [filters, setFilters] = useState<Set<string>>(new Set(['all']));
    const [isExpanded, setIsExpanded] = useState(true);
    const logContentRef = useRef<HTMLDivElement>(null);
    const prevEntriesLengthRef = useRef(entries.length);

    // Auto-scroll to bottom when new entries are added
    useEffect(() => {
        if (autoScroll && logContentRef.current && entries.length > prevEntriesLengthRef.current) {
            logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
        }
        prevEntriesLengthRef.current = entries.length;
    }, [entries.length, autoScroll]);

    // Filter entries based on active filters
    const filteredEntries = entries.filter(entry => {
        if (filters.has('all')) return true;
        return filters.has(entry.type);
    });

    // Limit entries to prevent performance issues
    const displayEntries = filteredEntries.slice(-maxEntries);

    const handleClear = () => {
        // This would be handled by parent component
        console.log('Clear log requested');
    };

    const handleToggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`log-panel ${className} ${isExpanded ? 'log-panel--expanded' : 'log-panel--collapsed'}`}>
            <div className="log-panel__header">
                <div className="log-panel__title">
                    <button
                        className="log-panel__toggle"
                        onClick={handleToggleExpanded}
                        title={isExpanded ? 'Collapse log' : 'Expand log'}
                    >
                        <span className="log-panel__toggle-icon">
                            {isExpanded ? '🔽' : '▶️'}
                        </span>
                        Combat Log
                    </button>

                    <div className="log-panel__badge">
                        {displayEntries.length}
                        {filteredEntries.length !== entries.length && ` / ${entries.length}`}
                    </div>
                </div>

                {isExpanded && (
                    <div className="log-panel__actions">
                        <button
                            className="log-panel__clear"
                            onClick={handleClear}
                            title="Clear log"
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>

            {isExpanded && (
                <>
                    {showFilters && (
                        <LogFilter
                            activeFilters={filters}
                            onFilterChange={setFilters}
                        />
                    )}

                    <div
                        className="log-panel__content"
                        ref={logContentRef}
                    >
                        {displayEntries.length === 0 ? (
                            <div className="log-panel__empty">
                                No log entries
                                {filters.has('all') ? '' : ' match current filters'}
                            </div>
                        ) : (
                            <div className="log-panel__entries">
                                {displayEntries.map((entry, index) => (
                                    <LogEntryComponent
                                        key={entry.id}
                                        entry={entry}
                                        isLatest={index === displayEntries.length - 1}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};