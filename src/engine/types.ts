/**
 * Core Engine Types & Contracts
 * Canvas 01 - Engine Skeleton
 */

export type Millis = number;
export type Seconds = number;

export interface TickContext {
  dtFixed: Seconds;       // Fixed delta for logic (e.g., 1/30)
  frameDt: Seconds;       // Actual frame delta (render info only)
  time: Seconds;          // Accumulated sim time
  events: EventBus;
  registry: ModuleRegistry;
}

export interface EngineModule {
  id: string;                         // unique module id
  init?(ctx: InitContext): void | Promise<void>;
  start?(ctx: StartContext): void;
  stop?(ctx: StopContext): void;
  tick?(ctx: TickContext): void;      // called by Engine each fixed step
  onEvent?(ev: EngineEvent): void;    // optional global listener
}

export interface InitContext { 
  events: EventBus; 
  registry: ModuleRegistry; 
}

export interface StartContext extends InitContext { }
export interface StopContext extends InitContext { }

export type EngineEvent = {
  type: string;          // e.g., 'core/boot', 'ui/toggle'
  payload?: unknown;
  requestId?: string;    // for request/response patterns
};

export interface EventBus {
  emit<T = unknown>(type: string, payload?: T): void;
  on<T = unknown>(type: string, handler: (p: T) => void): () => void;
  once<T = unknown>(type: string, handler: (p: T) => void): void;
  request<TReq = unknown, TRes = unknown>(type: string, payload?: TReq): Promise<TRes>;
}

export interface ModuleRegistry {
  register(mod: EngineModule): void;
  get(id: string): EngineModule | undefined;
  list(): EngineModule[];
}
