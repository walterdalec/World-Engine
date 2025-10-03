/**
 * World Map Engine - Refactored with Modular Components
 * 
 * Clean architecture using specialized components:
 * - GameHUD: Health/stats display and controls  
 * - GameMenu: Tabbed in-game menu system (M key)
 * - WorldRenderer: World display and rendering
 * - GameModals: Modal dialogs and popups
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WorldEngine } from '../../core/engine';
import { GameHUD } from '../ui';
import { GameMenu } from '../ui';
import WorldRenderer from './WorldRenderer';
import { GameModals } from '../ui';

interface WorldMapEngineProps {
  seedStr?: string;
  onBack: () => void;
}

export default function WorldMapEngine({ seedStr = "world-001", onBack }: WorldMapEngineProps) {
  // Helper to normalize stats for our components
  const normalizeStats = useCallback((engineStats: ReturnType<WorldEngine['getStats']>) => ({
    chunks: engineStats.chunks,
    discovered: engineStats.discovered,
    timeOfDay: typeof engineStats.timeOfDay === 'number' ?
      (engineStats.timeOfDay < 0.25 ? 'Night' :
        engineStats.timeOfDay < 0.5 ? 'Morning' :
          engineStats.timeOfDay < 0.75 ? 'Day' : 'Evening') :
      engineStats.timeOfDay,
    gameTime: engineStats.gameTime
  }), []);

  // Initialize engine
  const [engine] = useState(() => {
    console.log('🚀 Creating WorldEngine with seed:', seedStr);
    return new WorldEngine(seedStr);
  });

  // Force re-render hook to trigger when engine state changes
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  // Game state
  const [showGrid, setShowGrid] = useState(false);
  const [cameraLocked, setCameraLocked] = useState(true);
  const [stats, setStats] = useState(() => normalizeStats(engine.getStats()));

  // UI state for our modular components
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showWorldGenModal, setShowWorldGenModal] = useState(false);

  // Viewport for WorldRenderer
  const [viewport, setViewport] = useState({ width: 800, height: 600 });

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(normalizeStats(engine.getStats()));
    }, 1000);
    return () => clearInterval(interval);
  }, [engine, normalizeStats]);

  // Check if engine was loaded from save on startup and force update
  useEffect(() => {
    if (engine.wasLoadedFromSave()) {
      console.log('Engine was loaded from save, updating React state...');
      setStats(normalizeStats(engine.getStats()));
      forceUpdate();
    }
  }, [engine, normalizeStats]);

  // Check for encounters
  useEffect(() => {
    const activeEncounter = engine.getActiveEncounter();
    if (activeEncounter && !showEncounterModal) {
      setShowEncounterModal(true);
    }
  }, [engine, showEncounterModal]);

  // Handle viewport resizing
  useEffect(() => {
    const handleResize = () => {
      const container = document.querySelector('.world-container') as HTMLElement;
      if (container) {
        setViewport({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Game actions
  const handleMove = useCallback((dx: number, dy: number) => {
    if (engine.tickTravel(dx, dy)) {
      setStats(normalizeStats(engine.getStats()));
    }
  }, [engine, normalizeStats]);

  const handleRest = useCallback((hours: number) => {
    engine.rest(hours);
    setStats(normalizeStats(engine.getStats()));
    console.log(`💤 Rested ${hours}h. HP: ${engine.state.party.hitPoints}/${engine.state.party.maxHitPoints}`);
  }, [engine, normalizeStats]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys if any modal is open or if typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement ||
        showGameMenu || showEncounterModal || showCharacterModal || showWorldGenModal) {
        return;
      }

      switch (e.key.toLowerCase()) {
        // Movement
        case 'w': case 'arrowup': e.preventDefault(); handleMove(0, -1); break;
        case 's': case 'arrowdown': e.preventDefault(); handleMove(0, 1); break;
        case 'a': case 'arrowleft': e.preventDefault(); handleMove(-1, 0); break;
        case 'd': case 'arrowright': e.preventDefault(); handleMove(1, 0); break;
        case 'q': e.preventDefault(); handleMove(-1, -1); break;
        case 'e': e.preventDefault(); handleMove(1, -1); break;
        case 'z': e.preventDefault(); handleMove(-1, 1); break;
        case 'c': e.preventDefault(); handleMove(1, 1); break;

        // Actions
        case 'r': e.preventDefault(); handleRest(e.shiftKey ? 8 : 1); break;

        // UI Controls - This is where our modular system shines!
        case 'm': e.preventDefault(); setShowGameMenu(!showGameMenu); break;
        case 'i': case 'tab': e.preventDefault(); setShowCharacterModal(!showCharacterModal); break;
        case 'g': e.preventDefault(); setShowGrid(!showGrid); break;
        case 'l': e.preventDefault(); setCameraLocked(!cameraLocked); break;
        case 'escape':
          e.preventDefault();
          if (showGameMenu) setShowGameMenu(false);
          else if (showEncounterModal) setShowEncounterModal(false);
          else if (showCharacterModal) setShowCharacterModal(false);
          else if (showWorldGenModal) setShowWorldGenModal(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleRest, showGameMenu, showEncounterModal, showCharacterModal, showWorldGenModal, showGrid, cameraLocked]);

  // Encounter handling
  const handleEncounterAction = useCallback((action: 'fight' | 'flee' | 'negotiate' | 'explore') => {
    const activeEncounter = engine.getActiveEncounter();
    if (!activeEncounter) return;

    // Simple encounter resolution
    let success = true;
    switch (action) {
      case 'fight':
        success = Math.random() > 0.3; // 70% success rate for demo
        break;
      case 'flee':
        success = Math.random() > 0.2; // 80% success rate
        break;
      case 'negotiate':
        success = Math.random() > 0.4; // 60% success rate
        break;
      case 'explore':
        success = true; // Always succeeds
        break;
    }

    engine.completeEncounter(success);
    setShowEncounterModal(false);
    setStats(normalizeStats(engine.getStats()));
    console.log(`🎭 Encounter: ${action} -> ${success ? 'Success!' : 'Failed!'}`);
  }, [engine, normalizeStats]);

  const handleWorldGenSubmit = useCallback((config: any) => {
    if (Object.keys(config).length > 0) {
      engine.updateWorldConfig(config);
      setStats(normalizeStats(engine.getStats()));
      console.log('🌍 World config updated');
    }
  }, [engine, normalizeStats]);

  console.log('🎮 Rendering WorldMapEngine with modular components');

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      backgroundColor: '#0f172a',
      overflow: 'hidden',
      fontFamily: 'monospace'
    }}>
      {/* Main World Display */}
      <div className="world-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <WorldRenderer
          engine={engine}
          showGrid={showGrid}
          width={viewport.width}
          height={viewport.height}
        />
      </div>

      {/* 🎯 Component Integration - Clean Modular Architecture */}

      {/* Game HUD - Always visible overlay */}
      <GameHUD
        engine={engine}
        stats={stats}
        onBack={onBack}
        cameraLocked={cameraLocked}
        onCenterParty={() => console.log('🎯 Center camera on party')}
      />

      {/* In-Game Menu - Opens with M key */}
      <GameMenu
        engine={engine}
        isVisible={showGameMenu}
        onClose={() => setShowGameMenu(false)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        cameraLocked={cameraLocked}
        onToggleCameraLock={() => setCameraLocked(!cameraLocked)}
        onRefresh={() => {
          // Force re-render and update stats after loading
          forceUpdate();
          setStats(normalizeStats(engine.getStats()));
        }}
        stats={stats}
      />

      {/* Modal System - Handles all popups */}
      <GameModals
        engine={engine}
        showWorldGenModal={showWorldGenModal}
        onCloseWorldGenModal={() => setShowWorldGenModal(false)}
        onWorldGenSubmit={handleWorldGenSubmit}
        showEncounterModal={showEncounterModal}
        onCloseEncounterModal={() => {
          engine.dismissEncounter();
          setShowEncounterModal(false);
        }}
        onEncounterAction={handleEncounterAction}
        showCharacterModal={showCharacterModal}
        onCloseCharacterModal={() => setShowCharacterModal(false)}
      />

      {/* Help Text */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#e2e8f0',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '11px',
        lineHeight: '1.4',
        maxWidth: '300px',
        border: '1px solid rgba(75, 85, 99, 0.5)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#3b82f6' }}>
          🎮 Controls
        </div>
        <div><strong>Move:</strong> WASD / Arrow Keys</div>
        <div><strong>Rest:</strong> R (1hr) / Shift+R (8hr)</div>
        <div><strong>Menu:</strong> M • <strong>Character:</strong> I/Tab</div>
        <div><strong>Grid:</strong> G • <strong>Camera:</strong> L</div>
        <div><strong>Close:</strong> ESC</div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#e2e8f0',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          border: '1px solid rgba(75, 85, 99, 0.5)'
        }}>
          <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '4px' }}>
            DEBUG
          </div>
          <div>Seed: {engine.state.seed}</div>
          <div>Pos: ({engine.state.party.x}, {engine.state.party.y})</div>
          <div>HP: {engine.state.party.hitPoints}/{engine.state.party.maxHitPoints}</div>
          <div>Level: {engine.state.party.level}</div>
          <div>Weather: {engine.state.weather.type}</div>
          <div>Risk: {Math.round(engine.state.encounterClock.riskLevel * 100)}%</div>
        </div>
      )}
    </div>
  );
}
