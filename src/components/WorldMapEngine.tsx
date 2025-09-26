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
  const [engine] = useState(() => new WorldEngine(seedStr));
  const [viewport, setViewport] = useState<ViewportState>({
    centerX: engine.state.party.x,
    centerY: engine.state.party.y,
    scale: 1.0,
    width: 800,
    height: 600
  });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [cameraLocked, setCameraLocked] = useState(true);
  const [stats, setStats] = useState(engine.getStats());

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(engine.getStats());
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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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
          if (engine.tickTravel(0, -moveDistance)) moved = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (engine.tickTravel(0, moveDistance)) moved = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (engine.tickTravel(-moveDistance, 0)) moved = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (engine.tickTravel(moveDistance, 0)) moved = true;
          break;
        case ' ':
          e.preventDefault();
          engine.rest(1); // Rest for 1 hour
          moved = true;
          break;
        case 'g':
        case 'G':
          setShowGrid(prev => !prev);
          break;
        case 'c':
        case 'C':
          setCameraLocked(true);
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
  }, [engine, cameraLocked]);

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
    const loadRadius = Math.max(tilesWidth, tilesHeight) / 2 + 32;
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
  }, [engine, viewport, showGrid, worldToScreen]);

  // Render on every frame
  useEffect(() => {
    const animate = () => {
      renderWorld();
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
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
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
        <div style={{ marginTop: '8px' }}>
          <div>Position: ({engine.state.party.x}, {engine.state.party.y})</div>
          <div>Weather: {engine.state.weather.type} ({Math.round(engine.state.weather.intensity * 100)}%)</div>
          <div>Time: {stats.gameTime}</div>
        </div>
      </div>

      {/* Dev Panel */}
      <DevPanel 
        engine={engine} 
        onConfigChange={handleConfigChange}
      />
    </div>
  );
}