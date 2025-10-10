/**
 * Performance Overlay
 * Canvas 01 - FPS and tick counter HUD
 */

import React, { useEffect, useRef, useState } from 'react';
import { EventBus } from '../types';

interface PerfOverlayProps {
  events: EventBus;
}

export function PerfOverlay({ events }: PerfOverlayProps) {
  const [fps, setFps] = useState(0);
  const [ticks, setTicks] = useState(0);
  const last = useRef(performance.now());
  const frames = useRef(0);

  useEffect(() => {
    let raf = 0;
    
    const loop = () => {
      frames.current++;
      const now = performance.now();
      
      if (now - last.current >= 1000) {
        setFps(frames.current);
        frames.current = 0;
        last.current = now;
      }
      
      raf = requestAnimationFrame(loop);
    };
    
    raf = requestAnimationFrame(loop);
    
    const off = events.on<{ ticks: number }>('debug/tick', ({ ticks }) => {
      setTicks(ticks);
    });
    
    return () => { 
      cancelAnimationFrame(raf); 
      off(); 
    };
  }, [events]);

  return (
    <div className="fixed top-2 left-2 text-xs bg-black/60 text-white rounded px-2 py-1 font-mono z-50">
      <div>FPS: {fps}</div>
      <div>Ticks: {ticks}</div>
    </div>
  );
}
