/**
 * DevBar - Development Tools Bar
 * Canvas 02 - Quick access to save/load with keyboard shortcuts
 * Canvas 03 - Added pack loading controls
 */

import React, { useEffect, useState, useCallback } from 'react';
import { EventBus } from '../engine/types';

interface DevBarProps {
  events: EventBus;
}

export function DevBar({ events }: DevBarProps) {
  const [visible, setVisible] = useState(false);
  const [day, setDay] = useState(0);
  const [lastSave, setLastSave] = useState<string>('');
  const [packStats, setPackStats] = useState({ total: 0, biomes: 0, units: 0, items: 0, spells: 0, factions: 0 });

  // Refresh pack stats
  const refreshPackStats = useCallback(async () => {
    try {
      const stats = await events.request<void, typeof packStats>('packs/stats');
      setPackStats(stats);
    } catch {
      // PacksModule not loaded yet
    }
  }, [events]);

  useEffect(() => {
    // Initial pack stats load
    refreshPackStats();

    // Listen for day changes
    const offDay = events.on<{ day: number }>('game/day-advanced', ({ day }) => {
      setDay(day);
    });

    // Listen for debug ticks to update day
    const offTick = events.on<{ day: number }>('debug/tick', ({ day }) => {
      if (day !== undefined) setDay(day);
    });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        events.emit('save/download');
        events.emit('save/autosave');
        setLastSave(new Date().toLocaleTimeString());
      }

      // Ctrl+L or Cmd+L - Load
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        events.emit('load/file');
      }

      // Ctrl+` - Toggle DevBar
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setVisible(v => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      offDay();
      offTick();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [events, refreshPackStats]);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded hover:bg-gray-700 z-50"
        title="Show DevBar (Ctrl+`)"
      >
        DevTools
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white border-t border-gray-700 p-2 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Day:</span>
            <span className="font-mono font-bold">{day}</span>
          </div>
          
          {lastSave && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Last Save:</span>
              <span className="font-mono text-green-400">{lastSave}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              events.emit('save/download');
              events.emit('save/autosave');
              setLastSave(new Date().toLocaleTimeString());
            }}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
            title="Save (Ctrl+S)"
          >
            💾 Save
          </button>

          <button
            onClick={() => events.emit('load/file')}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium transition-colors"
            title="Load (Ctrl+L)"
          >
            📂 Load
          </button>

          <button
            onClick={() => events.emit('load/autosave')}
            className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm font-medium transition-colors"
            title="Load Autosave"
          >
            ⚡ Autosave
          </button>

          <button
            onClick={() => {
              refreshPackStats();
            }}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm font-medium transition-colors"
            title="Refresh pack stats"
          >
            📦 Packs ({packStats.total})
          </button>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-white px-2 py-1 text-sm"
            title="Hide (Ctrl+`)"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-2 text-xs text-gray-500 flex gap-4">
        <span>💡 Ctrl+S: Save</span>
        <span>📂 Ctrl+L: Load</span>
        <span>⚙️ Ctrl+`: Toggle DevBar</span>
      </div>
    </div>
  );
}
