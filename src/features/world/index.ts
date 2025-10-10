// World feature exports
export { default as EnhancedWorldMap } from './EnhancedWorldMap';
export { default as SimpleWorldMap } from './SimpleWorldMap';
export { default as HexWorldMap } from './HexWorldMap';
export { default as SmoothWorldMap } from './components/SmoothWorldMap';
export { default as WorldMapEngine } from './WorldMapEngine';
export { default as WorldRenderer } from './WorldRenderer';
export { WorldSetupScreen } from './WorldSetupScreen';
// NOTE: ExplorationMode moved to src/_legacy/world/ (uses old BattleSystem)

// Procedural generation system (TODO #11)
export * from './procedural';