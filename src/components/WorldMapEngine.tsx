/**
 * World Map Engine - Continental World Generation with Lazy Loading
 * 
 * Integrates the new world engine with React for live world exploration
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WorldEngine } from '../engine/index';
import DevPanel from './DevPanel';
import type { WorldGenConfig } from '../proc/chunks';

interface WorldMapEngineProps {
  seedStr?: string;
  onBack: () => void;
}

interface ViewportState {
  centerX: number;
  centerY: number;
  scale: number;
  width: number;
  height: number;
}

const TILE_SIZE = 8; // pixels per tile at scale 1.0
const MIN_SCALE = 0.25;
const MAX_SCALE = 4.0;

// Biome colors for rendering
const BIOME_COLORS: Record<string, string> = {
  'Ocean': '#1e3a8a',
  'Coast': '#3b82f6',
  'Grass': '#65a30d',
  'Forest': '#166534',
  'Jungle': '#064e3b',
  'Savanna': '#ca8a04',
  'Desert': '#eab308',
  'Taiga': '#374151',
  'Tundra': '#6b7280',
  'Swamp': '#365314',
  'Mountain': '#78716c',
  'Snow': '#f8fafc'
};

export default function WorldMapEngine({ seedStr = "world-001", onBack }: WorldMapEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => {
    try {
      console.log('Creating WorldEngine with seed:', seedStr);
      const engine = new WorldEngine(seedStr);
      console.log('WorldEngine created successfully');
      return engine;
    } catch (error) {
      console.error('Error creating WorldEngine:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
      throw error; // Re-throw so we can see the error in browser console
    }
  });
  const [viewport, setViewport] = useState<ViewportState>(() => {
    try {
      return {
        centerX: engine.state.party.x,
        centerY: engine.state.party.y,
        scale: 1.0,
        width: 800,
        height: 600
      };
    } catch (error) {
      console.error('Error initializing viewport:', error);
      // Return safe defaults
      return {
        centerX: 1024,
        centerY: 1024,
        scale: 1.0,
        width: 800,
        height: 600
      };
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [cameraLocked, setCameraLocked] = useState(true);
  const [stats, setStats] = useState(() => {
    try {
      return engine.getStats();
    } catch (error) {
      console.error('Error getting initial stats:', error);
      return {
        chunks: { loaded: 0, total: 0 },
        discovered: 0,
        timeOfDay: 'Dawn',
        gameTime: 'Day 1, Spring Year 1 - 08:00'
      };
    }
  });
  const [selectedFortification, setSelectedFortification] = useState<{
    chokepoint: any;
    result?: any;
  } | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<any>(null);
  const [showAbilities, setShowAbilities] = useState(false);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        setStats(engine.getStats());
        // Check for new encounters
        const encounter = engine.getActiveEncounter();
        setActiveEncounter(encounter);
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [engine]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      setViewport(prev => ({
        ...prev,
        width: rect.width,
        height: rect.height
      }));
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size
    
    // Auto-focus canvas for keyboard input
    if (canvasRef.current) {
      canvasRef.current.focus();
      console.log('Canvas focused for keyboard input');
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const worldX = viewport.centerX + (screenX - viewport.width / 2) / (TILE_SIZE * viewport.scale);
    const worldY = viewport.centerY + (screenY - viewport.height / 2) / (TILE_SIZE * viewport.scale);
    return { x: Math.floor(worldX), y: Math.floor(worldY) };
  }, [viewport]);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number): { x: number; y: number } => {
    const screenX = (worldX - viewport.centerX) * TILE_SIZE * viewport.scale + viewport.width / 2;
    const screenY = (worldY - viewport.centerY) * TILE_SIZE * viewport.scale + viewport.height / 2;
    return { x: screenX, y: screenY };
  }, [viewport]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setCameraLocked(false);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setViewport(prev => ({
        ...prev,
        centerX: prev.centerX - deltaX / (TILE_SIZE * prev.scale),
        centerY: prev.centerY - deltaY / (TILE_SIZE * prev.scale)
      }));
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = Math.abs(e.clientX - dragStartPos.x);
      const deltaY = Math.abs(e.clientY - dragStartPos.y);
      
      // If mouse didn't move much, treat as a click
      if (deltaX < 5 && deltaY < 5) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = screenToWorld(screenX, screenY);
        
        // Check if clicked on a fortification
        const chokepoint = engine.getChokepointAt(worldPos.x, worldPos.y);
        if (chokepoint?.fortified && chokepoint.fortification && !chokepoint.fortification.cleared) {
          const result = engine.attemptFortificationClear(worldPos.x, worldPos.y);
          setSelectedFortification({ chokepoint, result });
        } else {
          setSelectedFortification(null);
        }
      }
      
      setIsDragging(false);
    }
  }, [isDragging, dragStartPos, screenToWorld, engine]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport(prev => ({
      ...prev,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * delta))
    }));
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const moveDistance = 1;
      let moved = false;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          try {
            moved = engine.tickTravel(0, -moveDistance);
          } catch (error) {
            console.error('Error calling engine.tickTravel:', error);
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          try {
            moved = engine.tickTravel(0, moveDistance);
          } catch (error) {
            console.error('Error calling engine.tickTravel:', error);
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          try {
            moved = engine.tickTravel(-moveDistance, 0);
          } catch (error) {
            console.error('Error calling engine.tickTravel:', error);
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          try {
            moved = engine.tickTravel(moveDistance, 0);
          } catch (error) {
            console.error('Error calling engine.tickTravel:', error);
          }
          break;
        case ' ':
          e.preventDefault();
          try {
            engine.rest(1); // Rest for 1 hour
            moved = true;
          } catch (error) {
            console.error('Error calling engine.rest:', error);
          }
          break;
        case 'g':
        case 'G':
          setShowGrid(prev => !prev);
          break;
        case 'c':
        case 'C':
          setCameraLocked(true);
          break;
        case 'v':
        case 'V':
          setShowAbilities(prev => !prev);
          break;
      }

      if (moved && cameraLocked) {
        setViewport(prev => ({
          ...prev,
          centerX: engine.state.party.x,
          centerY: engine.state.party.y
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, cameraLocked, setShowGrid, setCameraLocked, setViewport]);

  // Handle world config changes from dev panel
  const handleConfigChange = useCallback((newConfig: Partial<WorldGenConfig>) => {
    engine.updateWorldConfig(newConfig);
    // Force a re-render by updating viewport
    setViewport(prev => ({ ...prev }));
  }, [engine]);

  // Main rendering function
  const renderWorld = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate visible tile bounds
      const margin = 2; // Extra tiles for smooth scrolling
      const tilesWidth = Math.ceil(canvas.width / (TILE_SIZE * viewport.scale)) + margin * 2;
      const tilesHeight = Math.ceil(canvas.height / (TILE_SIZE * viewport.scale)) + margin * 2;
      
      const startX = Math.floor(viewport.centerX - tilesWidth / 2);
      const startY = Math.floor(viewport.centerY - tilesHeight / 2);
      const endX = startX + tilesWidth;
      const endY = startY + tilesHeight;

    // Ensure chunks are loaded for visible area
    const loadRadius = Math.min(32, Math.max(tilesWidth, tilesHeight) / 2 + 8); // Much smaller radius
    engine.ensureRadius(Math.ceil(loadRadius));

    // Draw tiles
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = engine.getTile(x, y);
        const screenPos = worldToScreen(x, y);
        const tileSize = TILE_SIZE * viewport.scale;

        if (!tile || !engine.isDiscovered(x, y)) {
          // Draw fog of war
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(screenPos.x, screenPos.y, tileSize, tileSize);
        } else {
          // Draw biome
          ctx.fillStyle = BIOME_COLORS[tile.biome] || '#666666';
          ctx.fillRect(screenPos.x, screenPos.y, tileSize, tileSize);

          // Draw features
          if (tile.river) {
            ctx.fillStyle = '#3b82f6';
            const riverWidth = Math.max(1, tileSize * 0.3);
            ctx.fillRect(
              screenPos.x + tileSize * 0.35,
              screenPos.y,
              riverWidth,
              tileSize
            );
          }

          if (tile.road) {
            ctx.fillStyle = '#92400e';
            const roadWidth = Math.max(1, tileSize * 0.2);
            ctx.fillRect(
              screenPos.x + tileSize * 0.4,
              screenPos.y + tileSize * 0.4,
              tileSize * 0.2,
              roadWidth
            );
          }

          if (tile.settlement) {
            ctx.fillStyle = '#dc2626';
            const settlementSize = Math.max(2, tileSize * 0.6);
            ctx.fillRect(
              screenPos.x + (tileSize - settlementSize) / 2,
              screenPos.y + (tileSize - settlementSize) / 2,
              settlementSize,
              settlementSize
            );
          }
        }
      }
    }

    // Draw grid if enabled
    if (showGrid && viewport.scale >= 0.5) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      for (let x = startX; x <= endX; x++) {
        const screenX = worldToScreen(x, 0).x;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
      }
      
      for (let y = startY; y <= endY; y++) {
        const screenY = worldToScreen(0, y).y;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
      }
    }

    // Draw party
    const partyScreen = worldToScreen(engine.state.party.x, engine.state.party.y);
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    const partySize = Math.max(4, TILE_SIZE * viewport.scale * 0.8);
    
    ctx.beginPath();
    ctx.arc(
      partyScreen.x + TILE_SIZE * viewport.scale / 2,
      partyScreen.y + TILE_SIZE * viewport.scale / 2,
      partySize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Draw chokepoints and fortifications
    const chokepoints = engine.getChokepoints();
    for (const chokepoint of chokepoints) {
      // Only draw if in visible area
      if (chokepoint.x >= startX && chokepoint.x <= endX && 
          chokepoint.y >= startY && chokepoint.y <= endY &&
          engine.isDiscovered(chokepoint.x, chokepoint.y)) {
        
        const chokepointScreen = worldToScreen(chokepoint.x, chokepoint.y);
        const tileSize = TILE_SIZE * viewport.scale;
        
        if (chokepoint.fortified && chokepoint.fortification) {
          const fort = chokepoint.fortification;
          
          // Choose color based on cleared status and difficulty
          let fortColor: string;
          if (fort.cleared) {
            fortColor = '#4ade80'; // Green for cleared
          } else if (fort.level >= 8) {
            fortColor = '#dc2626'; // Red for very dangerous
          } else if (fort.level >= 6) {
            fortColor = '#ea580c'; // Orange for dangerous
          } else if (fort.level >= 4) {
            fortColor = '#eab308'; // Yellow for moderate
          } else {
            fortColor = '#64748b'; // Gray for easy
          }
          
          // Draw fortification based on type
          ctx.fillStyle = fortColor;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(1, viewport.scale);
          
          const centerX = chokepointScreen.x + tileSize / 2;
          const centerY = chokepointScreen.y + tileSize / 2;
          const fortSize = Math.max(3, tileSize * 0.7);
          
          if (fort.type === 'citadel' || fort.type === 'keep') {
            // Draw castle/keep as rectangle with corner towers
            const rectSize = fortSize * 0.8;
            ctx.fillRect(
              centerX - rectSize / 2,
              centerY - rectSize / 2,
              rectSize,
              rectSize
            );
            ctx.strokeRect(
              centerX - rectSize / 2,
              centerY - rectSize / 2,
              rectSize,
              rectSize
            );
            
            // Corner towers
            const towerSize = rectSize * 0.3;
            const corners = [
              [-rectSize/2, -rectSize/2],
              [rectSize/2 - towerSize, -rectSize/2],
              [-rectSize/2, rectSize/2 - towerSize],
              [rectSize/2 - towerSize, rectSize/2 - towerSize]
            ];
            
            for (const [dx, dy] of corners) {
              ctx.fillRect(centerX + dx, centerY + dy, towerSize, towerSize);
              ctx.strokeRect(centerX + dx, centerY + dy, towerSize, towerSize);
            }
          } else if (fort.type === 'watchtower') {
            // Draw tower as circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, fortSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (fort.type === 'wall') {
            // Draw wall as thick line
            const wallThickness = fortSize * 0.3;
            ctx.fillRect(
              centerX - fortSize / 2,
              centerY - wallThickness / 2,
              fortSize,
              wallThickness
            );
            ctx.strokeRect(
              centerX - fortSize / 2,
              centerY - wallThickness / 2,
              fortSize,
              wallThickness
            );
          } else {
            // Default: draw as diamond
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - fortSize / 2);
            ctx.lineTo(centerX + fortSize / 2, centerY);
            ctx.lineTo(centerX, centerY + fortSize / 2);
            ctx.lineTo(centerX - fortSize / 2, centerY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          
          // Draw difficulty level if scale is large enough
          if (viewport.scale >= 1.0 && tileSize >= 20) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.max(8, tileSize * 0.2)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              fort.level.toString(),
              centerX,
              centerY
            );
          }
        } else {
          // Draw natural chokepoint (no fortification)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.strokeStyle = '#666666';
          ctx.lineWidth = Math.max(1, viewport.scale * 0.5);
          
          const centerX = chokepointScreen.x + tileSize / 2;
          const centerY = chokepointScreen.y + tileSize / 2;
          const chokepointSize = Math.max(2, tileSize * 0.4);
          
          // Draw based on chokepoint type
          if (chokepoint.type === 'bridge') {
            // Draw as horizontal line
            ctx.beginPath();
            ctx.moveTo(centerX - chokepointSize, centerY);
            ctx.lineTo(centerX + chokepointSize, centerY);
            ctx.stroke();
          } else if (chokepoint.type === 'pass') {
            // Draw as gap between mountains
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - chokepointSize);
            ctx.lineTo(centerX, centerY + chokepointSize);
            ctx.stroke();
          } else {
            // Draw as small circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, chokepointSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }
  }, [engine, viewport, showGrid, worldToScreen]);

  // Render on every frame
  useEffect(() => {
    let lastRenderTime = 0;
    const targetFPS = 30; // Cap at 30 FPS instead of 60
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime: number) => {
      if (currentTime - lastRenderTime >= frameInterval) {
        renderWorld();
        lastRenderTime = currentTime;
      }
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [renderWorld]);

  const centerOnParty = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      centerX: engine.state.party.x,
      centerY: engine.state.party.y
    }));
    setCameraLocked(true);
  }, [engine.state.party.x, engine.state.party.y]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          cursor: isDragging ? 'grabbing' : 'grab',
          outline: 'none' // Remove focus outline
        }}
        tabIndex={0} // Make canvas focusable
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={() => {
          // Ensure canvas has focus for keyboard events
          if (canvasRef.current) {
            canvasRef.current.focus();
          }
        }}
        onKeyDown={(e) => {
          const moveDistance = 1;
          let moved = false;

          switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
              try {
                moved = engine.tickTravel(0, -moveDistance);
              } catch (error) {
                console.error('Canvas Error calling engine.tickTravel:', error);
              }
              break;
            case 'ArrowDown':
            case 's':
            case 'S':
              try {
                moved = engine.tickTravel(0, moveDistance);
              } catch (error) {
                console.error('Canvas Error calling engine.tickTravel:', error);
              }
              break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
              try {
                moved = engine.tickTravel(-moveDistance, 0);
              } catch (error) {
                console.error('Canvas Error calling engine.tickTravel:', error);
              }
              break;
            case 'ArrowRight':
            case 'd':
            case 'D':
              try {
                moved = engine.tickTravel(moveDistance, 0);
              } catch (error) {
                console.error('Canvas Error calling engine.tickTravel:', error);
              }
              break;
            case ' ':
              e.preventDefault();
              try {
                engine.rest(1);
                moved = true;
              } catch (error) {
                console.error('Canvas Error calling engine.rest:', error);
              }
              break;
            case 'g':
            case 'G':
              setShowGrid(prev => !prev);
              break;
            case 'c':
            case 'C':
              setCameraLocked(true);
              break;
            case 'v':
            case 'V':
              setShowAbilities(prev => !prev);
              break;
          }

          if (moved && cameraLocked) {
            setViewport(prev => ({
              ...prev,
              centerX: engine.state.party.x,
              centerY: engine.state.party.y
            }));
          }
        }}
      />

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
            onClick={centerOnParty}
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
        <div><strong>Rest:</strong> Space (1 hour)</div>
        <div><strong>View:</strong> Mouse drag, scroll to zoom</div>
        <div><strong>Grid:</strong> G key</div>
        <div><strong>Center:</strong> C key</div>
        <div><strong>Abilities:</strong> V key</div>
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

      {/* Dev Panel */}
      <DevPanel 
        engine={engine} 
        onConfigChange={handleConfigChange}
      />
      
      {/* Fortification Modal */}
      {selectedFortification && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #374151',
          maxWidth: '400px',
          zIndex: 200,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#f1f5f9' }}>
              {selectedFortification.chokepoint.fortification.name}
            </h3>
            <button
              onClick={() => setSelectedFortification(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                width: '24px',
                height: '24px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px 0', color: '#e2e8f0', fontSize: '14px' }}>
              {selectedFortification.chokepoint.fortification.description}
            </p>
            
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
              <div><strong>Type:</strong> {selectedFortification.chokepoint.fortification.type}</div>
              <div><strong>Difficulty Level:</strong> {selectedFortification.chokepoint.fortification.level}</div>
              <div><strong>Garrison:</strong> {selectedFortification.chokepoint.fortification.garrison} soldiers</div>
              <div><strong>Required Level:</strong> {selectedFortification.chokepoint.fortification.requiredLevel}</div>
              
              {selectedFortification.chokepoint.fortification.requiredGear.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Required Equipment:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                    {selectedFortification.chokepoint.fortification.requiredGear.map((gear: string) => (
                      <li key={gear} style={{ 
                        color: engine.state.party.equipment.includes(gear) ? '#4ade80' : '#ef4444' 
                      }}>
                        {gear.replace(/_/g, ' ')} {engine.state.party.equipment.includes(gear) ? '✓' : '✗'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {selectedFortification.result ? (
            <div style={{
              padding: '12px',
              borderRadius: '4px',
              background: selectedFortification.result.success ? 
                'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${selectedFortification.result.success ? '#22c55e' : '#ef4444'}`
            }}>
              <h4 style={{ margin: '0 0 8px 0' }}>
                {selectedFortification.result.success ? 'Victory!' : 'Cannot Attack'}
              </h4>
              
              {selectedFortification.result.success ? (
                <>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
                    The fortification has been cleared! The route is now open.
                  </p>
                  
                  {selectedFortification.result.rewards && selectedFortification.result.rewards.length > 0 && (
                    <div>
                      <strong>Rewards:</strong>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '12px' }}>
                        {selectedFortification.result.rewards.map((reward: any, i: number) => (
                          <li key={i} style={{ color: '#4ade80' }}>
                            {reward.name} - {reward.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5' }}>
                  You need to meet the level and equipment requirements to challenge this fortification.
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const result = engine.attemptFortificationClear(
                    selectedFortification.chokepoint.x,
                    selectedFortification.chokepoint.y
                  );
                  setSelectedFortification({ ...selectedFortification, result });
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Attack Fortification
              </button>
              <button
                onClick={() => setSelectedFortification(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retreat
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Encounter Modal */}
      {activeEncounter && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #374151',
          maxWidth: '500px',
          zIndex: 250,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#f1f5f9' }}>
              {activeEncounter.name}
            </h3>
            <div style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: 
                activeEncounter.danger === 'extreme' ? '#dc2626' :
                activeEncounter.danger === 'high' ? '#ea580c' :
                activeEncounter.danger === 'medium' ? '#eab308' :
                activeEncounter.danger === 'low' ? '#65a30d' : '#6b7280',
              color: 'white'
            }}>
              {activeEncounter.danger.toUpperCase()}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 16px 0', color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5' }}>
              {activeEncounter.description}
            </p>
            
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#cbd5e1' }}>
              <div><strong>Type:</strong> {activeEncounter.type}</div>
              <div><strong>Location:</strong> ({activeEncounter.x}, {activeEncounter.y})</div>
              
              {activeEncounter.rewards && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Potential Rewards:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', color: '#4ade80' }}>
                    {activeEncounter.rewards.experience && (
                      <li>{activeEncounter.rewards.experience} Experience</li>
                    )}
                    {activeEncounter.rewards.gold && (
                      <li>{activeEncounter.rewards.gold} Gold</li>
                    )}
                    {activeEncounter.rewards.items && activeEncounter.rewards.items.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeEncounter.type === 'combat' && (
              <button
                onClick={() => {
                  // TODO: Start combat encounter
                  engine.completeEncounter(true);
                  setActiveEncounter(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ⚔️ Fight
              </button>
            )}
            
            {activeEncounter.type === 'event' && (
              <button
                onClick={() => {
                  engine.completeEncounter(true);
                  setActiveEncounter(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🗨️ Interact
              </button>
            )}
            
            {activeEncounter.type === 'discovery' && (
              <button
                onClick={() => {
                  engine.completeEncounter(true);
                  setActiveEncounter(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🔍 Explore
              </button>
            )}
            
            {activeEncounter.type === 'trader' && (
              <button
                onClick={() => {
                  engine.completeEncounter(true);
                  setActiveEncounter(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ea580c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                💰 Trade
              </button>
            )}
            
            <button
              onClick={() => {
                engine.dismissEncounter();
                setActiveEncounter(null);
              }}
              style={{
                flex: activeEncounter.type === 'combat' ? 1 : 0.5,
                padding: '12px',
                background: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {activeEncounter.type === 'combat' ? '🏃 Flee' : '❌ Ignore'}
            </button>
          </div>
        </div>
      )}
      
      {/* Physical Abilities Panel */}
      {showAbilities && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #374151',
          maxWidth: '350px',
          maxHeight: '70vh',
          overflowY: 'auto',
          zIndex: 200,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#f1f5f9' }}>Physical Abilities</h3>
            <button
              onClick={() => setShowAbilities(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                width: '24px',
                height: '24px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ marginBottom: '16px', fontSize: '13px' }}>
            <div><strong>Level:</strong> {engine.state.party.level}</div>
            <div><strong>Experience:</strong> {engine.state.party.experience}/{engine.state.party.level * 100}</div>
            <div style={{ marginTop: '8px' }}>
              <strong>Stats:</strong>
              <div style={{ fontSize: '12px', marginLeft: '8px' }}>
                <div>STR: {engine.state.party.stats.strength} | DEX: {engine.state.party.stats.dexterity}</div>
                <div>CON: {engine.state.party.stats.constitution} | INT: {engine.state.party.stats.intelligence}</div>
                <div>WIS: {engine.state.party.stats.wisdom} | CHA: {engine.state.party.stats.charisma}</div>
              </div>
            </div>
          </div>

          {/* Known Abilities */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#4ade80' }}>Known Abilities</h4>
            {engine.state.party.knownAbilities.length > 0 ? (
              <div style={{ fontSize: '12px' }}>
                {engine.state.party.knownAbilities.map((ability, i) => (
                  <div key={i} style={{ 
                    padding: '4px 8px', 
                    margin: '2px 0',
                    background: 'rgba(34, 197, 94, 0.2)',
                    borderRadius: '4px',
                    border: '1px solid #22c55e'
                  }}>
                    {ability}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                No abilities learned yet. Gain experience to unlock abilities!
              </div>
            )}
          </div>

          {/* Available Abilities */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#eab308' }}>Available to Learn</h4>
            {(() => {
              try {
                const available = engine.getAvailablePhysicalAbilities().filter(
                  ability => !engine.state.party.knownAbilities.includes(ability.name)
                );
                
                return available.length > 0 ? (
                  <div style={{ fontSize: '12px' }}>
                    {available.slice(0, 5).map((ability, i) => (
                      <div key={i} style={{ 
                        padding: '8px', 
                        margin: '4px 0',
                        background: 'rgba(234, 179, 8, 0.2)',
                        borderRadius: '4px',
                        border: '1px solid #eab308'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>{ability.name}</div>
                        <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '2px' }}>
                          {ability.school} • {ability.tier}
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                          {ability.description}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          Stamina Cost: {ability.staminaCost} | Level: {ability.requirements.minLevel}
                        </div>
                        <button
                          onClick={() => {
                            const success = engine.learnPhysicalAbility(ability.name);
                            if (success) {
                              console.log(`Learned ${ability.name}!`);
                              // Force re-render by updating a state value
                              setStats(prev => ({ ...prev }));
                            }
                          }}
                          style={{
                            marginTop: '4px',
                            padding: '2px 6px',
                            background: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          Learn
                        </button>
                      </div>
                    ))}
                    {available.length > 5 && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '8px' }}>
                        ... and {available.length - 5} more abilities available
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No new abilities available. Level up or get better equipment!
                  </div>
                );
              } catch (error) {
                console.error('Error getting abilities:', error);
                return (
                  <div style={{ fontSize: '12px', color: '#ef4444' }}>
                    Error loading abilities
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
}