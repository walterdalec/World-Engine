// packages/core/src/unit/serialize.ts
import type { Unit } from './types';

export interface UnitSaveV1 {
    $schema: 'unit/v1';
    v: 1;
    u: Unit;
}

export function saveUnit(u: Unit): UnitSaveV1 {
    return { $schema: 'unit/v1', v: 1, u };
}

export function loadUnit(s: UnitSaveV1): Unit {
    return s.u;
}