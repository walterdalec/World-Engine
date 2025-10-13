/**
 * Pixi v8 Renderer Test Page
 * 
 * Standalone test page for validating the GPU-accelerated renderer.
 */

import React, { useEffect, useRef } from 'react';
import { initPixiV8Demo } from '../features/world/demo/PixiV8Demo';

interface PixiV8TestPageProps {
  onBack: () => void;
}

export function PixiV8TestPage({ onBack }: PixiV8TestPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize demo
    (async () => {
      try {
        const cleanup = await initPixiV8Demo(containerRef.current!);
        cleanupRef.current = cleanup;
        console.log('✅ Pixi v8 demo initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Pixi v8 demo:', error);
      }
    })();

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0b0f14',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to bottom, rgba(15,23,42,0.95), rgba(15,23,42,0.8))',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid rgba(100,116,139,0.3)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        zIndex: 10,
      }}>
        <div>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#f8fafc',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            🎮 Pixi v8 Renderer Test
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#94a3b8',
          }}>
            GPU-Accelerated Terrain Rendering • 64x64 Tile Chunks • Sprite Batching
          </p>
        </div>
        <button
          onClick={onBack}
          style={{
            background: '#374151',
            color: '#f8fafc',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4b5563';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#374151';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← Back to Menu
        </button>
      </div>

      {/* Instructions Panel */}
      <div style={{
        background: 'rgba(30,41,59,0.9)',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(100,116,139,0.2)',
        display: 'flex',
        gap: '32px',
        fontSize: '13px',
        color: '#cbd5e1',
        zIndex: 10,
      }}>
        <div><strong>🖱️ Pan:</strong> Click and drag</div>
        <div><strong>🔍 Zoom:</strong> Mouse wheel</div>
        <div><strong>📊 Stats:</strong> Check console (F12)</div>
        <div><strong>✨ Features:</strong> 2x2 chunks • 6 biomes • Coastlines • 60fps target</div>
      </div>

      {/* Pixi Canvas Container */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      />

      {/* Info Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(15,23,42,0.9)',
        padding: '16px 20px',
        borderRadius: '8px',
        border: '1px solid rgba(100,116,139,0.3)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        fontSize: '12px',
        color: '#cbd5e1',
        maxWidth: '300px',
        zIndex: 10,
      }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#f8fafc',
        }}>
          Renderer Info
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div><strong>System:</strong> Pixi v8 Sprite Batching</div>
          <div><strong>Chunks:</strong> 2x2 (128x128 tiles)</div>
          <div><strong>Tile Size:</strong> 16x16 pixels</div>
          <div><strong>Atlas:</strong> 4x4 grid (16 biomes)</div>
          <div><strong>Performance:</strong> ~60fps target</div>
        </div>
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(100,116,139,0.3)',
          fontSize: '11px',
          opacity: 0.8,
        }}>
          Open browser console (F12) for detailed stats and debug info
        </div>
      </div>
    </div>
  );
}
