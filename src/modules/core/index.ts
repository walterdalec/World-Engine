/**
 * Core Module
 * Canvas 01 - Minimal baseline module that boots the engine
 */

import { EngineModule, TickContext } from '../../engine/types';

let ticks = 0;

export const CoreModule: EngineModule = {
  id: 'core',
  
  start({ events }) {
    console.log('🎮 Core module started');
    events.emit('core/boot', { at: Date.now() });
  },
  
  tick(ctx: TickContext) {
    ticks++;
    
    // Emit debug tick every second (30 ticks at 30fps)
    if (ticks % 30 === 0) {
      ctx.events.emit('debug/tick', { ticks, time: ctx.time });
    }
  }
};
