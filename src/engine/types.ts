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
    init?(_ctx: InitContext): void | Promise<void>;
    start?(_ctx: StartContext): void;
    stop?(_ctx: StopContext): void;
    tick?(_ctx: TickContext): void;      // called by Engine each fixed step
    onEvent?(_ev: EngineEvent): void;    // optional global listener
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
    emit<T = unknown>(_type: string, _payload?: T): void;
    on<T = unknown>(_type: string, _handler: (_p: T) => void): () => void;
    once<T = unknown>(_type: string, _handler: (_p: T) => void): void;
    request<TReq = unknown, TRes = unknown>(_type: string, _payload?: TReq): Promise<TRes>;
    respond<TReq = unknown, TRes = unknown>(_type: string, _fn: (_p: TReq) => Promise<TRes>): void;
}

export interface ModuleRegistry {
    register(_mod: EngineModule): void;
    get(_id: string): EngineModule | undefined;
    list(): EngineModule[];
}
