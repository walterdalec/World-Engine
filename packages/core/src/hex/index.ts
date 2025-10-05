/**
 * Hex Grid Core Library
 * Engine-agnostic hex mathematics and utilities
 */

// Core Types and Constructors
export type { Axial, Cube, Offset } from './types';
export { axial, cube, offset } from './types';

// Coordinate Conversions
export {
    axialToCube,
    cubeToAxial,
    axialToOffset,
    offsetToAxial,
    cubeToOffset,
    offsetToCube,
    axialToPixel,
    pixelToAxial
} from './convert';

// Direction Constants
export {
    AXIAL_DIRS,
    CUBE_DIRS,
    DIRECTION_NAMES
} from './directions';

// Distance and Neighbor Operations
export {
    cubeDistance,
    axialDistance,
    axialAdd,
    axialSubtract,
    axialScale,
    neighbors,
    neighbor,
    axialEquals,
    axialManhattan
} from './distance';

// Line Drawing and LOS
export {
    axialLine,
    isLineBlocked,
    axialLineToBlocked,
    axialBresenham,
    hasLineOfSight
} from './line';

// Ring and Spiral Generation
export {
    hexRing,
    hexSpiral,
    hexRingFiltered,
    hexSpiralFiltered,
    hexRingWalk,
    hexRange,
    hexAtDistance,
    hexFloodFill
} from './ring';

// Grid Bounds and Utilities
export type { HexBounds, HexRect, HexCircle, HexCustom } from './grid';
export {
    isHexRect,
    isHexCircle,
    isHexCustom,
    hexInBounds,
    createHexRect,
    createHexCircle,
    createHexCustom,
    getAllHexesInRect,
    getHexBoundingRect,
    expandHexRect,
    hexRectsIntersect,
    intersectHexRects,
    hexRectArea,
    createInfiniteHexBounds,
    CommonBounds
} from './grid';

// Serialization Support
export {
    serializeAxial,
    deserializeAxial,
    serializeCube,
    deserializeCube,
    serializeOffset,
    deserializeOffset,
    serializeAxialArray,
    deserializeAxialArray,
    serializeAxialSet,
    deserializeAxialSet,
    axialToKey,
    keyToAxial,
    serializeAxialMap,
    deserializeAxialMap,
    serializeAxialBinary,
    deserializeAxialBinary
} from './serialize';

// Import functions for convenience object
import {
    axialDistance,
    neighbors,
    neighbor,
    axialEquals,
    axialAdd,
    axialSubtract,
    axialScale
} from './distance';

import {
    hexRing,
    hexSpiral,
    hexRange,
    hexFloodFill
} from './ring';

import {
    axialLine,
    hasLineOfSight
} from './line';

import {
    serializeAxial,
    deserializeAxial,
    axialToKey,
    keyToAxial
} from './serialize';

// Convenience re-exports for common operations
export const HexUtils = {
    // Distance operations
    distance: axialDistance,
    neighbors,
    neighbor,
    equals: axialEquals,

    // Coordinate math
    add: axialAdd,
    subtract: axialSubtract,
    scale: axialScale,

    // Pattern generation
    ring: hexRing,
    spiral: hexSpiral,
    range: hexRange,
    floodFill: hexFloodFill,

    // Line operations
    line: axialLine,
    lineOfSight: hasLineOfSight,

    // Serialization
    serialize: serializeAxial,
    deserialize: deserializeAxial,
    toKey: axialToKey,
    fromKey: keyToAxial
} as const;