/**
 * Canvas 08 - Time Controls UI Component
 * 
 * User interface for pause/resume and speed control.
 */

import React, { useEffect, useState } from 'react';
import { getSimClock } from './clock';
import type { SimSpeed, TimeEvent } from './types';

export interface TimeControlsProps {
  /** Position of the controls */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Whether to show speed options */
  showSpeedControls?: boolean;
  
  /** Whether to show pause button */
  showPauseButton?: boolean;
  
  /** Custom class name */
  className?: string;
}

export const TimeControls: React.FC<TimeControlsProps> = ({
  position = 'top-right',
  showSpeedControls = true,
  showPauseButton = true,
  className = ''
}) => {
  const clock = getSimClock();
  const [speed, setSpeed] = useState<SimSpeed>(clock.getState().speed);
  const [paused, setPaused] = useState(clock.getState().paused);
  const [stepIndex, setStepIndex] = useState(clock.getState().stepIndex);
  const [day, setDay] = useState(clock.getState().day);

  useEffect(() => {
    // Subscribe to time events
    const unsubscribe = clock.addEventListener((event: TimeEvent) => {
      if (event.type === 'time/speedChanged') {
        setSpeed(event.speed);
        setPaused(event.speed === 0);
      } else if (event.type === 'time/paused') {
        setPaused(true);
      } else if (event.type === 'time/resumed') {
        setPaused(false);
      } else if (event.type === 'time/tick') {
        setStepIndex(event.stepIndex);
        setDay(Math.floor(event.timeSec / 86400) + 1);
      }
    });

    return unsubscribe;
  }, [clock]);

  const handleSpeedChange = (newSpeed: SimSpeed) => {
    clock.setSimSpeed(newSpeed);
  };

  const handleTogglePause = () => {
    clock.togglePause();
  };

  const positionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2 ${className}`}
      style={{
        fontFamily: 'monospace',
        fontSize: '14px'
      }}
    >
      {/* Pause Button */}
      {showPauseButton && (
        <button
          onClick={handleTogglePause}
          className={`px-4 py-2 rounded font-bold transition-colors ${
            paused
              ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          title={paused ? 'Resume (Space)' : 'Pause (Space)'}
        >
          {paused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>
      )}

      {/* Speed Controls */}
      {showSpeedControls && (
        <div className="flex gap-1 bg-gray-800 bg-opacity-90 p-2 rounded">
          {([0, 1, 2, 4] as SimSpeed[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`px-3 py-1 rounded transition-colors ${
                speed === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={`Speed ${s}x (${s === 0 ? 'Paused' : s === 1 ? 'Normal' : 'Fast'})`}
            >
              {s === 0 ? '⏸' : `${s}×`}
            </button>
          ))}
        </div>
      )}

      {/* Status Display */}
      <div className="bg-gray-800 bg-opacity-90 px-3 py-2 rounded text-white text-xs">
        <div>Speed: {paused ? 'PAUSED' : `${speed}×`}</div>
        <div>Day: {day}</div>
        <div>Step: {stepIndex}</div>
      </div>

      {/* Pause Overlay */}
      {paused && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-none"
          style={{ zIndex: -1 }}
        >
          <div className="text-white text-6xl font-bold opacity-75">
            ⏸ PAUSED
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Keyboard handler for time controls
 */
export const useTimeControlsKeyboard = () => {
  useEffect(() => {
    const clock = getSimClock();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          clock.togglePause();
          break;
        case '0':
          e.preventDefault();
          clock.setSimSpeed(0);
          break;
        case '1':
          e.preventDefault();
          clock.setSimSpeed(1);
          break;
        case '2':
          e.preventDefault();
          clock.setSimSpeed(2);
          break;
        case '3':
        case '4':
          e.preventDefault();
          clock.setSimSpeed(4);
          break;
        case 'Escape':
          // Auto-pause on ESC (for menus)
          clock.setSimSpeed(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};

/**
 * Hook to get current clock state
 */
export const useSimClockState = () => {
  const clock = getSimClock();
  const [state, setState] = useState(clock.getState());

  useEffect(() => {
    const unsubscribe = clock.addEventListener(() => {
      setState(clock.getState());
    });

    return unsubscribe;
  }, [clock]);

  return state;
};
