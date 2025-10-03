/**
 * Game HUD - Health, stats display and control information
 */

import React from 'react';
import { WorldEngine } from '../../core/engine';

interface GameHUDProps {
  engine: WorldEngine;
  stats: {
    chunks: { loaded?: number; total?: number } | any;
    discovered: number;
    timeOfDay: string;
    gameTime: string;
  };
  onBack: () => void;
  cameraLocked: boolean;
  onCenterParty: () => void;
}

export default function GameHUD({ 
  engine, 
  stats, 
  onBack, 
  cameraLocked, 
  onCenterParty 
}: GameHUDProps) {
  return (
    <>
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 16px',
            background: '#374151',
            color: '#f9fafb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Menu
        </button>
        
        {!cameraLocked && (
          <button
            onClick={onCenterParty}
            style={{
              padding: '8px 12px',
              background: '#059669',
              color: '#f9fafb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            📍 Recenter on Party
          </button>
        )}
      </div>

      {/* Controls Info */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#f9fafb',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: '1.4',
        zIndex: 100
      }}>
        <div><strong>Movement:</strong> Arrow keys or WASD</div>
        <div><strong>Rest:</strong> Space (1 hour, restores HP/Stamina/Ether)</div>
        <div><strong>View:</strong> Mouse drag, scroll to zoom</div>
        <div><strong>Grid:</strong> G key</div>
        <div><strong>Center:</strong> C key</div>
        <div><strong>Game Menu:</strong> M key (Stats, Abilities, Spells, Creation)</div>
        <div><strong>Close Menu:</strong> ESC or M key</div>
        <div style={{ marginTop: '8px' }}>
          <div>Position: ({engine.state.party.x}, {engine.state.party.y})</div>
          <div>
            Health: 
            <span style={{ 
              color: engine.state.party.hitPoints / engine.state.party.maxHitPoints > 0.7 ? '#4ade80' : 
                     engine.state.party.hitPoints / engine.state.party.maxHitPoints > 0.3 ? '#eab308' : '#ef4444',
              fontWeight: 'bold'
            }}>
              {engine.state.party.hitPoints}/{engine.state.party.maxHitPoints}
            </span>
          </div>
          <div>
            Stamina: 
            <span style={{ 
              color: engine.state.party.stamina / engine.state.party.maxStamina > 0.7 ? '#4ade80' : 
                     engine.state.party.stamina / engine.state.party.maxStamina > 0.3 ? '#eab308' : '#ef4444',
              fontWeight: 'bold'
            }}>
              {engine.state.party.stamina}/{engine.state.party.maxStamina}
            </span>
          </div>
          <div>
            Ether: 
            <span style={{ 
              color: engine.state.party.ether / engine.state.party.maxEther > 0.7 ? '#4ade80' : 
                     engine.state.party.ether / engine.state.party.maxEther > 0.3 ? '#eab308' : '#ef4444',
              fontWeight: 'bold'
            }}>
              {engine.state.party.ether}/{engine.state.party.maxEther}
            </span>
          </div>
          <div>Level: {engine.state.party.level} (XP: {engine.state.party.experience})</div>
          <div>Weather: {engine.state.weather.type} ({Math.round(engine.state.weather.intensity * 100)}%)</div>
          <div>Time: {stats.gameTime}</div>
          <div>
            Encounter Risk: 
            <span style={{ 
              color: engine.state.encounterClock.riskLevel > 0.7 ? '#ef4444' : 
                     engine.state.encounterClock.riskLevel > 0.4 ? '#eab308' : '#4ade80',
              fontWeight: 'bold'
            }}>
              {Math.round(engine.state.encounterClock.riskLevel * 100)}%
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
