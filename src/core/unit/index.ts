// packages/core/src/unit/index.ts

// Core types and interfaces
export type {
    School,
    DamageKind,
    Stats,
    Resist,
    Derived,
    EquipmentMod,
    Item,
    EquipmentSlots,
    StatusInst,
    Unit,
    HitContext,
    DamageIn,
    DamageOut
} from './types';

// Balance constants
export { Balance } from './balance';

// Derived stat computation
export { computeDerived, sumStats } from './derived';

// Equipment system
export { gatherEquipMods } from './equipment';

// Status system
export type { StatusHook } from './status';
export { StatusLib, tickStatuses } from './status';

// Damage system
export type { HitRollOut } from './damage';
export { rollToHit, rollCrit, computeDamage } from './damage';

// Serialization
export type { UnitSaveV1 } from './serialize';
export { saveUnit, loadUnit } from './serialize';