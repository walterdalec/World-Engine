/**
 * Formation System
 * Complete tactical positioning system with facing, formations, flanking, and zones of control
 */

// Core systems
export * from './facing';
export * from './formation';
export * from './flanking';
export * from './zoc';

// Convenient re-exports for common operations
export { type Dir, type Arc, dirBetween, classifyArc } from './facing';
export { type Row, type FormationTag, getFormation, setFormation, isBackRow } from './formation';
export { type FlankInfo, type FlankMods, flankInfo, flankModifiers } from './flanking';
export { enemiesAdjacentTo, violatesZoC, isEngaged } from './zoc';