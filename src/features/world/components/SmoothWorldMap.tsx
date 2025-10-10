/**
 * Smooth World Map - Organic Continuous Terrain
 * 
 * HYBRID ARCHITECTURE: Smooth overworld exploration (like M&M)
 * Hex battles will be generated from this terrain when combat triggers.
 * 
 * Features:
 * - 360° WASD movement with momentum
 * - Noise-based procedural terrain
 * - Biome-based coloring
 * - Smooth camera follow
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WorldPos } from '../../../core/types';
import { sampleOverworld, initTerrainGenerator } from '../terrain/terrainGenerator';

interface SmoothWorldMapProps {
  seed: string;
  onEncounter?: (_pos: WorldPos) => void;
  onSettlement?: (_pos: WorldPos) => void;
}

export default function SmoothWorldMap({ seed }: SmoothWorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState<WorldPos>({ x: 0, y: 0 });
  const [vel, setVel] = useState({ x: 0, y: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  
  // Initialize terrain generator with seed
  useEffect(() => {
    initTerrainGenerator(seed);
    console.log('🌍 SmoothWorldMap initialized with seed:', seed);
  }, [seed]);
  
  // Keyboard input handling
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current[key] = e.type === 'keydown';
      
      // Prevent arrow key scrolling
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);
  
  // Game loop
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const loop = (timestamp: number) => {
      const deltaTime = lastFrameRef.current ? (timestamp - lastFrameRef.current) / 1000 : 0.016;
      lastFrameRef.current = timestamp;
      
      updateMovement(deltaTime);
      render(ctx, deltaTime);
      
      animationRef.current = requestAnimationFrame(loop);
    };
    
    animationRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - we want this to run once
  
  /**
   * Update player movement with momentum
   */
  const updateMovement = useCallback((dt: number) => {
    const speed = 8; // World units per second
    const accel = { x: 0, y: 0 };
    
    // WASD controls
    if (keys.current['w'] || keys.current['arrowup']) accel.y -= 1;
    if (keys.current['s'] || keys.current['arrowdown']) accel.y += 1;
    if (keys.current['a'] || keys.current['arrowleft']) accel.x -= 1;
    if (keys.current['d'] || keys.current['arrowright']) accel.x += 1;
    
    // Alternative movement (QWEASD hex-style also works)
    if (keys.current['q']) { accel.x -= 0.866; accel.y -= 0.5; }
    if (keys.current['e']) { accel.x += 0.866; accel.y -= 0.5; }
    
    // Normalize diagonal movement
    const len = Math.hypot(accel.x, accel.y) || 1;
    const ax = (accel.x / len) * speed;
    const ay = (accel.y / len) * speed;
    
    // Apply acceleration with momentum
    setVel(v => {
      const newVx = (v.x + ax * dt * 10) * 0.85; // Friction
      const newVy = (v.y + ay * dt * 10) * 0.85;
      return { x: newVx, y: newVy };
    });
    
    // Update position
    setPos(p => {
      const newX = p.x + vel.x * dt;
      const newY = p.y + vel.y * dt;
      
      // Check terrain at new position
      const sample = sampleOverworld({ x: newX, y: newY });
      
      // Block movement into impassable terrain
      if (sample.blocked) {
        return p; // Don't move if blocked
      }
      
      return { x: newX, y: newY };
    });
  }, [vel]);
  
  /**
   * Render terrain and player
   */
  const render = useCallback((ctx: CanvasRenderingContext2D, _dt: number) => {
    const canvas = ctx.canvas;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    
    // Clear background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, displayW, displayH);
    
    // Render terrain around player
    const scale = 8; // Pixels per world unit
    const sampleStep = 3; // Sample every N pixels for performance
    
    for (let sy = 0; sy < displayH; sy += sampleStep) {
      for (let sx = 0; sx < displayW; sx += sampleStep) {
        // Convert screen position to world position
        const worldX = pos.x + (sx - displayW / 2) / scale;
        const worldY = pos.y + (sy - displayH / 2) / scale;
        
        // Sample terrain
        const sample = sampleOverworld({ x: worldX, y: worldY });
        
        // Get terrain color
        const color = getTerrainColor(sample.biome, sample.height, sample.moisture);
        
        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, sampleStep, sampleStep);
      }
    }
    
    // Draw player at center
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(displayW / 2, displayH / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw velocity indicator (facing direction)
    if (Math.hypot(vel.x, vel.y) > 0.1) {
      const angle = Math.atan2(vel.y, vel.x);
      const arrowLen = 15;
      const endX = displayW / 2 + Math.cos(angle) * arrowLen;
      const endY = displayH / 2 + Math.sin(angle) * arrowLen;
      
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(displayW / 2, displayH / 2);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Draw position info
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(`Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`, 10, 20);
    
    const sample = sampleOverworld(pos);
    ctx.fillText(`Biome: ${sample.biome}`, 10, 40);
    ctx.fillText(`Height: ${sample.height.toFixed(2)}`, 10, 60);
    ctx.fillText(`Moisture: ${sample.moisture.toFixed(2)}`, 10, 80);
    
    // Controls help
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.fillText('WASD or Arrows to move', 10, displayH - 20);
    
  }, [pos, vel]);
  
  return (
    <div className="relative w-full h-full bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm font-mono">
        <div className="font-bold mb-2">🌍 Smooth Overworld</div>
        <div>WASD / Arrows: Move</div>
        <div>Q/E: Diagonal</div>
        <div className="mt-2 text-xs text-gray-400">
          {vel.x !== 0 || vel.y !== 0 ? '🏃 Moving' : '🧍 Standing'}
        </div>
      </div>
    </div>
  );
}

/**
 * Get display color for a biome
 */
function getTerrainColor(biome: string, height: number, moisture: number): string {
  // Height-based shading
  const brightness = Math.floor((height + 1) * 25); // -1..1 → 0..50
  
  switch (biome) {
    case 'water':
      return `rgb(${20 + brightness}, ${50 + brightness}, ${100 + brightness})`;
    
    case 'shore':
      return `rgb(${180 + brightness}, ${160 + brightness}, ${120 + brightness})`;
    
    case 'plains':
      return `rgb(${100 + brightness}, ${180 + brightness}, ${80 + brightness})`;
    
    case 'forest':
      const greenShade = Math.floor(moisture * 50);
      return `rgb(${30 + brightness}, ${100 + greenShade + brightness}, ${40 + brightness})`;
    
    case 'swamp':
      return `rgb(${60 + brightness}, ${80 + brightness}, ${60 + brightness})`;
    
    case 'desert':
      return `rgb(${200 + brightness}, ${180 + brightness}, ${120 + brightness})`;
    
    case 'hills':
      return `rgb(${120 + brightness}, ${100 + brightness}, ${80 + brightness})`;
    
    case 'mountains':
      return `rgb(${100 + brightness}, ${100 + brightness}, ${100 + brightness})`;
    
    case 'snow':
      return `rgb(${230 + brightness}, ${240 + brightness}, ${250 + brightness})`;
    
    case 'volcanic':
      return `rgb(${80 + brightness}, ${40 + brightness}, ${40 + brightness})`;
    
    default:
      return `rgb(${100 + brightness}, ${100 + brightness}, ${100 + brightness})`;
  }
}
