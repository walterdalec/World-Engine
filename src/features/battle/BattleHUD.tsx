/**
 * BattleHUD.tsx - Clean action buttons + current unit info
 * Minimal, production-ready battle HUD that can be imported anywhere
 */

import React from 'react';
import { BattleState, Unit, Ability } from './types';

interface BattleHUDProps {
    state: BattleState;
    selectedUnit?: Unit | null;
    onAbilityUse: (abilityId: string, unitId: string) => void;
    onEndTurn: () => void;
    onDefend: (unitId: string) => void;
    onWait: (unitId: string) => void;
}export function BattleHUD({
    state,
    selectedUnit,
    onAbilityUse,
    onEndTurn,
    onDefend,
    onWait
}: BattleHUDProps) {
    const isAbilityOnCooldown = (abilityId: string): boolean => {
        const cooldowns = state.commander.runtime.cooldowns || {};
        return (cooldowns[abilityId] || 0) > 0;
    };

    const getCooldownText = (abilityId: string): string => {
        const cooldowns = state.commander.runtime.cooldowns || {};
        const cd = cooldowns[abilityId] || 0;
        return cd > 0 ? ` (${cd})` : '';
    };

    const canActThisPhase = () => {
        if (state.phase === "HeroTurn") return true;
        if (state.phase === "UnitsTurn" && selectedUnit?.faction === "Player") return true;
        return false;
    };

    const isGameOver = state.phase === "Victory" || state.phase === "Defeat";

    return (
        <div style={{
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #333',
            fontFamily: 'system-ui, sans-serif'
        }}>
            {/* Phase and Turn Info */}
            <div style={{
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {state.phase === "Victory" && "🎉 Victory!"}
                        {state.phase === "Defeat" && "💀 Defeat"}
                        {!isGameOver && `${state.phase} - Round ${state.turn}`}
                    </h3>
                    {selectedUnit && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#ccc' }}>
                            {selectedUnit.name} - {selectedUnit.stats.hp}/{selectedUnit.stats.maxHp} HP
                        </p>
                    )}
                </div>

                {!isGameOver && (
                    <button
                        onClick={onEndTurn}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        End {state.phase === "HeroTurn" ? "Hero Turn" : "Turn"}
                    </button>
                )}
            </div>

            {/* Hero Commands (HeroTurn only) */}
            {state.phase === "HeroTurn" && !isGameOver && (
                <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Hero Commands</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {state.commander.abilities.map(ability => (
                            <button
                                key={ability.id}
                                onClick={() => onAbilityUse(ability.id, "hero-1")}
                                disabled={isAbilityOnCooldown(ability.id)}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: isAbilityOnCooldown(ability.id) ? '#333' : '#2196F3',
                                    color: isAbilityOnCooldown(ability.id) ? '#666' : 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isAbilityOnCooldown(ability.id) ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    fontSize: '14px'
                                }}
                                title={ability.description}
                            >
                                <div style={{ fontWeight: 'bold' }}>
                                    {ability.name}{getCooldownText(ability.id)}
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                    Range: {ability.range} | {ability.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Unit Actions (UnitsTurn only) */}
            {state.phase === "UnitsTurn" && selectedUnit && selectedUnit.faction === "Player" && !isGameOver && (
                <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Unit Actions</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => onDefend(selectedUnit.id)}
                            disabled={selectedUnit.hasActed}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: selectedUnit.hasActed ? '#333' : '#FF9800',
                                color: selectedUnit.hasActed ? '#666' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: selectedUnit.hasActed ? 'default' : 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🛡️ Defend (+2 DEF)
                        </button>

                        <button
                            onClick={() => onWait(selectedUnit.id)}
                            disabled={selectedUnit.hasActed}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: selectedUnit.hasActed ? '#333' : '#607D8B',
                                color: selectedUnit.hasActed ? '#666' : 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: selectedUnit.hasActed ? 'default' : 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ⏸️ Wait
                        </button>
                    </div>

                    <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#999',
                        display: 'flex',
                        gap: '16px'
                    }}>
                        <span>Move: {selectedUnit.stats.move - (selectedUnit.hasMoved ? selectedUnit.stats.move : 0)}/{selectedUnit.stats.move}</span>
                        <span>Range: {selectedUnit.stats.rng}</span>
                        <span>Status: {selectedUnit.hasActed ? "Acted" : selectedUnit.hasMoved ? "Moved" : "Ready"}</span>
                    </div>
                </div>
            )}

            {/* Commander Aura Info */}
            <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Commander Aura</h4>
                <div style={{
                    padding: '8px',
                    backgroundColor: '#2d4a2d',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    <strong>{state.commander.aura.name}</strong><br />
                    {Object.entries(state.commander.aura.stats).map(([stat, value]) => (
                        <span key={stat}>{stat.toUpperCase()} +{value} </span>
                    ))}
                </div>
            </div>

            {/* Battle Log */}
            <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Recent Events</h4>
                <div style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '12px'
                }}>
                    {state.log.length === 0 ? (
                        <em style={{ color: '#666' }}>No events yet...</em>
                    ) : (
                        <div>
                            {state.log.slice(-8).map((entry, i) => (
                                <div key={i} style={{ marginBottom: '2px', lineHeight: '1.3' }}>
                                    {entry}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Tips */}
            <div style={{
                marginTop: '12px',
                fontSize: '11px',
                color: '#666',
                borderTop: '1px solid #333',
                paddingTop: '8px'
            }}>
                <strong>Tips:</strong> Click hexes to move or target. Hero acts from off-field. Mercenaries fight on the battlefield.
            </div>
        </div>
    );
}