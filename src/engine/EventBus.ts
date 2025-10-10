/**
 * Event Bus Implementation
 * Canvas 01 - Simple typed pub/sub with request/response pattern
 */

import { EventBus } from './types';

export class SimpleEventBus implements EventBus {
  private listeners = new Map<string, Set<(p: any) => void>>();
  private responders = new Map<string, (p: any) => Promise<any>>();

  emit<T>(type: string, payload?: T): void {
    const set = this.listeners.get(type);
    if (!set) return;
    set.forEach(h => h(payload));
  }

  on<T>(type: string, handler: (p: T) => void): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(handler as any);
    this.listeners.set(type, set);
    return () => set.delete(handler as any);
  }

  once<T>(type: string, handler: (p: T) => void): void {
    const off = this.on<T>(type, (p) => { 
      off(); 
      handler(p); 
    });
  }

  async request<TReq, TRes>(type: string, payload?: TReq): Promise<TRes> {
    const responder = this.responders.get(type);
    if (!responder) throw new Error(`No responder for ${type}`);
    return responder(payload) as Promise<TRes>;
  }

  // Optional: register a single responder per type
  respond<TReq, TRes>(type: string, fn: (p: TReq) => Promise<TRes>): void {
    this.responders.set(type, fn as any);
  }
}
