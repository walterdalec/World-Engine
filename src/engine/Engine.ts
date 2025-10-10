/**
 * Engine Orchestrator
 * Canvas 01 - Main engine class that coordinates modules and simulation
 */

import { SimpleEventBus } from './EventBus';
import { Registry } from './Registry';
import { FixedStepper } from './Time';
import { EngineModule, InitContext } from './types';

export class Engine {
  readonly events = new SimpleEventBus();
  readonly registry = new Registry();
  private stopLoop?: () => void;

  register(mod: EngineModule): void {
    this.registry.register(mod);
  }

  async init(): Promise<void> {
    const ctx: InitContext = { 
      events: this.events, 
      registry: this.registry 
    };
    
    for (const m of this.registry.list()) {
      await m.init?.(ctx);
    }
  }

  start(): void {
    const startCtx = { 
      events: this.events, 
      registry: this.registry 
    };
    
    for (const m of this.registry.list()) {
      m.start?.(startCtx);
    }

    const stepper = new FixedStepper(1/30, (tickCtx) => {
      for (const m of this.registry.list()) {
        m.tick?.(tickCtx);
      }
    });
    
    this.stopLoop = stepper.start({ 
      events: this.events, 
      registry: this.registry, 
      dtFixed: 1/30,
      time: 0
    });
  }

  stop(): void {
    this.stopLoop?.();
    const stopCtx = { 
      events: this.events, 
      registry: this.registry 
    };
    
    for (const m of this.registry.list()) {
      m.stop?.(stopCtx);
    }
  }
}
