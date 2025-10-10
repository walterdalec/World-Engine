/**
 * Module Registry
 * Canvas 01 - Simple module registration system
 */

import { EngineModule, ModuleRegistry } from './types';

export class Registry implements ModuleRegistry {
    private mods: EngineModule[] = [];

    register(mod: EngineModule): void {
        if (this.mods.find(m => m.id === mod.id)) {
            throw new Error(`Duplicate module id: ${mod.id}`);
        }
        this.mods.push(mod);
    }

    get(id: string): EngineModule | undefined {
        return this.mods.find(m => m.id === id);
    }

    list(): EngineModule[] {
        return [...this.mods];
    }
}
