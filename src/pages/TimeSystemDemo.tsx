/**
 * Canvas 08 - Time System Demo
 * 
 * Demonstrates pause, speed control, and system registration.
 */

import React, { useEffect, useState } from 'react';
import {
  getSimClock,
  registerSystem,
  TimeControls,
  useTimeControlsKeyboard,
  type TickContext
} from '../core/time';

export const TimeSystemDemo: React.FC = () => {
  useTimeControlsKeyboard();
  
  const [exampleSystemLog, setExampleSystemLog] = useState<string[]>([]);
  const [catchupSystemLog, setCatchupSystemLog] = useState<string[]>([]);
  const [tickSystemLog, setTickSystemLog] = useState<string[]>([]);

  useEffect(() => {
    const clock = getSimClock();

    // Example 1: System that pauses (game logic)
    const unregisterPause = registerSystem(
      {
        id: 'example-pause-system',
        idlePolicy: 'pause',
        order: 'main',
        description: 'Example system that stops during pause (e.g., faction AI)'
      },
      (ctx: TickContext) => {
        if (ctx.stepIndex % 30 === 0) { // Log every second
          setExampleSystemLog((prev) => {
            const newLog = [
              `[Pause System] Step ${ctx.stepIndex}, Day ${ctx.day}, Time ${ctx.timeSec.toFixed(1)}s`,
              ...prev
            ].slice(0, 5);
            return newLog;
          });
        }
      }
    );

    // Example 2: Catchup system (background processing)
    const unregisterCatchup = registerSystem(
      {
        id: 'example-catchup-system',
        idlePolicy: 'catchup',
        order: 'late',
        description: 'Example catchup system (e.g., road precalc)'
      },
      (ctx: TickContext) => {
        if (ctx.stepIndex % 60 === 0) { // Log every 2 seconds
          setCatchupSystemLog((prev) => {
            const newLog = [
              `[Catchup System] Step ${ctx.stepIndex}, dt=${ctx.dt.toFixed(4)}s`,
              ...prev
            ].slice(0, 5);
            return newLog;
          });
        }
      }
    );

    // Example 3: System that always ticks (visual only)
    const unregisterTick = registerSystem(
      {
        id: 'example-tick-system',
        idlePolicy: 'tick',
        order: 'early',
        description: 'Example tick system (e.g., particles, animations)'
      },
      (ctx: TickContext) => {
        if (ctx.stepIndex % 90 === 0) { // Log every 3 seconds
          setTickSystemLog((prev) => {
            const newLog = [
              `[Tick System] Always running at step ${ctx.stepIndex} (paused: ${ctx.paused})`,
              ...prev
            ].slice(0, 5);
            return newLog;
          });
        }
      }
    );

    // Start the clock update loop
    let animationId: number;
    const loop = (timestamp: number) => {
      clock.update(timestamp);
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      unregisterPause();
      unregisterCatchup();
      unregisterTick();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <TimeControls position="top-right" />

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Canvas 08 - Time System Demo</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold mb-3">⏰ Deterministic Simulation Clock</h2>
          <p className="text-gray-300 mb-2">
            Fixed timestep (1/30s = 33.333ms) with pause, speed control, and idle policies.
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li><strong>Space</strong> - Toggle pause</li>
            <li><strong>0</strong> - Pause (0×)</li>
            <li><strong>1</strong> - Normal speed (1×)</li>
            <li><strong>2</strong> - Double speed (2×)</li>
            <li><strong>3/4</strong> - Quad speed (4×)</li>
            <li><strong>Esc</strong> - Auto-pause (for menus)</li>
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Pause System */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-red-400">🛑 Pause Policy</h3>
            <p className="text-sm text-gray-400 mb-3">
              Stops during pause (game logic, faction AI, economy)
            </p>
            <div className="bg-gray-900 p-3 rounded font-mono text-xs h-40 overflow-y-auto">
              {exampleSystemLog.length === 0 ? (
                <div className="text-gray-600">Waiting for ticks...</div>
              ) : (
                exampleSystemLog.map((log, i) => (
                  <div key={i} className="text-green-400 mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Catchup System */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-yellow-400">⏳ Catchup Policy</h3>
            <p className="text-sm text-gray-400 mb-3">
              Accumulates backlog during pause, processes on resume
            </p>
            <div className="bg-gray-900 p-3 rounded font-mono text-xs h-40 overflow-y-auto">
              {catchupSystemLog.length === 0 ? (
                <div className="text-gray-600">Waiting for ticks...</div>
              ) : (
                catchupSystemLog.map((log, i) => (
                  <div key={i} className="text-yellow-400 mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Tick System */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-blue-400">▶️ Tick Policy</h3>
            <p className="text-sm text-gray-400 mb-3">
              Continues ticking during pause (visual-only systems)
            </p>
            <div className="bg-gray-900 p-3 rounded font-mono text-xs h-40 overflow-y-auto">
              {tickSystemLog.length === 0 ? (
                <div className="text-gray-600">Waiting for ticks...</div>
              ) : (
                tickSystemLog.map((log, i) => (
                  <div key={i} className="text-blue-400 mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-3">🎯 Key Features</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-bold text-green-400 mb-1">✅ Deterministic</h4>
              <p className="text-gray-300">Fixed timestep ensures identical results for same seed + inputs</p>
            </div>
            <div>
              <h4 className="font-bold text-blue-400 mb-1">✅ Accumulator Pattern</h4>
              <p className="text-gray-300">Smooth rendering with interpolation between fixed steps</p>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-1">✅ Idle Policies</h4>
              <p className="text-gray-300">Systems declare pause, tick, or catchup behavior</p>
            </div>
            <div>
              <h4 className="font-bold text-purple-400 mb-1">✅ Speed Control</h4>
              <p className="text-gray-300">0× (pause), 1× (normal), 2×, 4× speed multipliers</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-3">📋 System Examples</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-bold">Pause:</span>
              <span className="text-gray-300">Faction AI (Canvas 09), Economy (Canvas 12), Encounters (Canvas 13), Rumors (Canvas 20)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold">Catchup:</span>
              <span className="text-gray-300">Road precalculation (Canvas 06), Analytics aggregation, Audio stream prewarm</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">Tick:</span>
              <span className="text-gray-300">Particles/VFX (Canvas 18), UI animations, Audio mixing (non-state)</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-900 bg-opacity-50 p-4 rounded-lg border border-blue-500">
          <h3 className="text-lg font-bold mb-2">💡 Try It Out</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Press <kbd className="bg-gray-700 px-2 py-1 rounded">Space</kbd> to pause - notice red "Pause System" stops logging</li>
            <li>Yellow "Catchup System" accumulates backlog during pause</li>
            <li>Blue "Tick System" continues running even when paused</li>
            <li>Resume with <kbd className="bg-gray-700 px-2 py-1 rounded">Space</kbd> - catchup system processes backlog</li>
            <li>Try <kbd className="bg-gray-700 px-2 py-1 rounded">2</kbd> or <kbd className="bg-gray-700 px-2 py-1 rounded">4</kbd> for speed control</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
