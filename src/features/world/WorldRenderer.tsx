/**
 * World Renderer - Handles the main world display and rendering
 */

import React from 'react';
import { WorldEngine } from '../../core/engine';

interface WorldRendererProps {
  engine: WorldEngine;
  showGrid: boolean;
  width: number;
  height: number;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

interface TileDisplayProps {
  tile: any;
  x: number;
  y: number;
  size: number;
  isExplored: boolean;
}

function TileDisplay({ tile, x, y, size, isExplored }: TileDisplayProps) {
  if (!isExplored) {
    return (
      <div
        style={{
          position: 'absolute',
          left: x * size,
          top: y * size,
          width: size,
          height: size,
          backgroundColor: '#1e293b',
          border: '1px solid #374151'
        }}
      />
    );
  }

  const tileColors: Record<string, string> = {
    grass: '#16a34a',
    forest: '#065f46',
    water: '#0ea5e9',
    mountain: '#78716c',
    desert: '#eab308',
    snow: '#f8fafc',
    swamp: '#365314',
    road: '#a3a3a3',
    town: '#dc2626',
    dungeon: '#7c2d12',
    ruins: '#6b7280',
    cave: '#44403c',
    bridge: '#8b5cf6'
  };

  const backgroundColor = tileColors[tile.type] || '#4b5563';

  return (
    <div
      style={{
        position: 'absolute',
        left: x * size,
        top: y * size,
        width: size,
        height: size,
        backgroundColor,
        border: '1px solid rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: 'white',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
      }}
      title={`${tile.type} (${x}, ${y})`}
    >
      {tile.features && tile.features.length > 0 && (
        <span style={{ fontSize: '10px' }}>
          {tile.features[0].charAt(0).toUpperCase()}
        </span>
      )}
      {tile.structure && (
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {tile.structure === 'settlement' ? '🏘️' :
            tile.structure === 'dungeon' ? '🏰' :
              tile.structure === 'ruins' ? '🏛️' : '⭐'}
        </span>
      )}
    </div>
  );
}

export default function WorldRenderer({ engine, showGrid, width, height, canvasRef }: WorldRendererProps) {
  const tileSize = 24;
  const viewportWidth = Math.floor(width / tileSize);
  const viewportHeight = Math.floor(height / tileSize);

  const centerX = engine.state.party.x;
  const centerY = engine.state.party.y;

  const startX = Math.floor(centerX - viewportWidth / 2);
  const startY = Math.floor(centerY - viewportHeight / 2);
  const endX = startX + viewportWidth;
  const endY = startY + viewportHeight;

  const tiles = [];

  // Render visible tiles
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = engine.getTile(x, y);
      const isExplored = engine.isDiscovered(x, y);

      tiles.push(
        <TileDisplay
          key={`${x},${y}`}
          tile={tile}
          x={x - startX}
          y={y - startY}
          size={tileSize}
          isExplored={isExplored}
        />
      );
    }
  }

  // Party position (always centered)
  const partyX = Math.floor(viewportWidth / 2);
  const partyY = Math.floor(viewportHeight / 2);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#0f172a'
    }}>
      {/* Canvas for any additional rendering */}
      {canvasRef && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}

      {/* World tiles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}>
        {tiles}
      </div>

      {/* Grid overlay */}
      {showGrid && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${tileSize}px ${tileSize}px`,
          pointerEvents: 'none',
          zIndex: 3
        }}
        />
      )}

      {/* Party marker */}
      <div
        style={{
          position: 'absolute',
          left: partyX * tileSize + tileSize / 2 - 8,
          top: partyY * tileSize + tileSize / 2 - 8,
          width: 16,
          height: 16,
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          border: '2px solid white',
          zIndex: 10,
          boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)',
          animation: 'pulse 2s infinite'
        }}
      />

      {/* Weather overlay */}
      {engine.state.weather.type !== 'Clear' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: (() => {
            const intensity = engine.state.weather.intensity;
            switch (engine.state.weather.type) {
              case 'Rain':
                return `linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, ${intensity * 0.3}) 50%, transparent 70%)`;
              case 'Storm':
                return `linear-gradient(45deg, transparent 20%, rgba(59, 130, 246, ${intensity * 0.5}) 40%, transparent 60%)`;
              case 'Snow':
                return `radial-gradient(circle, rgba(248, 250, 252, ${intensity * 0.4}) 2px, transparent 3px)`;
              case 'Fog':
                return `rgba(156, 163, 175, ${intensity * 0.6})`;
              case 'Wind':
                return `linear-gradient(30deg, transparent 40%, rgba(234, 179, 8, ${intensity * 0.2}) 60%, transparent 80%)`;
              default:
                return 'none';
            }
          })(),
          backgroundSize: engine.state.weather.type === 'Snow' ? '20px 20px' : '100% 100%',
          pointerEvents: 'none',
          zIndex: 5,
          animation: engine.state.weather.type === 'Rain' || engine.state.weather.type === 'Storm'
            ? 'rainFall 0.5s linear infinite'
            : engine.state.weather.type === 'Snow'
              ? 'snowFall 3s linear infinite'
              : 'none'
        }}
        />
      )}

      {/* Day/Night cycle overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: (() => {
          const hour = Math.floor(engine.state.time.minutes / 60) % 24;
          if (hour >= 6 && hour < 18) {
            // Day
            return 'rgba(255, 255, 255, 0.1)';
          } else if ((hour >= 18 && hour < 20) || (hour >= 5 && hour < 7)) {
            // Twilight
            return 'rgba(234, 179, 8, 0.2)';
          } else {
            // Night
            return 'rgba(15, 23, 42, 0.6)';
          }
        })(),
        pointerEvents: 'none',
        zIndex: 6
      }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { 
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
          }
          50% { 
            box-shadow: 0 0 16px rgba(59, 130, 246, 1);
          }
        }
        
        @keyframes rainFall {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        
        @keyframes snowFall {
          0% { background-position: 0% 0%; }
          100% { background-position: 20px 20px; }
        }
      `}</style>
    </div>
  );
}