# Dimetric Terrain Rendering

## Overview

The World Engine terrain renderer now supports **dimetric projection** (isometric-style tilted view) with enhanced river and road overlays.

## Features

### 1. Dimetric Projection
All terrain and overlays are rendered under a shared `worldLayer` with configurable tilt:

```typescript
import { setDimetric } from './overworld';

// Apply dimetric transform (default: scaleY=0.5, shearX=0.5)
setDimetric(pixiApp, { scaleY: 0.5, shearX: 0.5 });

// Adjust for steeper angle
setDimetric(pixiApp, { scaleY: 0.45, shearX: 0.6 });
```

### 2. Enhanced River Overlays
Rivers now render as widening channels with:
- **Width ramping**: Thin at mountain sources, wider downstream
- **Foam highlights**: White accents on steep segments
- **Marshy deltas**: When rivers don't reach the sea, they create swamp fans

Rivers are automatically added as an overlay during terrain generation.

### 3. Roads Overlay
Clean road rendering with dual-tone highlighting:

```typescript
import { makeRoadsOverlay } from './overworld';

const roads = [
  { 
    points: [{x:100, y:240}, {x:280, y:300}, {x:540, y:280}], 
    width: 3.5, 
    tint: '#8a6a4a',
    alpha: 0.9
  }
];

// Add to terrain options
generateTerrain(app, {
  overlays: [makeRoadsOverlay('roads', roads)]
});
```

## Architecture

### Layer Hierarchy
```
stage
└── worldLayer (dimetric transform applied here)
    ├── terrainLayer (base terrain sprite)
    └── overlayLayer (sortable children)
        ├── rivers (zIndex: 5)
        └── roads (zIndex: 6)
```

### Transform Pipeline
1. **Generate terrain pixels** with normal coordinates
2. **Generate river paths** using downhill flow algorithm
3. **Create base texture** from pixel data
4. **Apply dimetric transform** to worldLayer (affects all children)
5. **Add overlays** (rivers, roads) as separate sprites under worldLayer

### Coordinate Conversion
For mouse picking or entity placement:

```typescript
import { dimetricToWorld } from './overworld';

// Screen coordinates (from mouse event)
const screenX = event.clientX;
const screenY = event.clientY;

// Convert to world coordinates (before dimetric)
const { x, y } = dimetricToWorld(screenX, screenY, { scaleY: 0.5, shearX: 0.5 });
```

## Implementation Details

### River Overlay Rendering
- **Polyline stroking**: Each river path is stroked with variable width
- **Length calculation**: Total path length determines width interpolation
- **Slope detection**: Elevation difference triggers foam highlights
- **Marsh generation**: Procedural ellipses using seeded RNG for consistency

### Marsh Bias System
Terrain biomes automatically boost swamp weights near river pixels:

```typescript
const nearRiver = riverGen.isRiver(x, y) || riverGen.isRiver(x+1, y) || riverGen.isRiver(x, y+1);
const swampBoost = nearRiver ? 0.15 : 0.0;
const swampW = clamp01(moist * 0.9 + swampBoost - elev * 0.5) * clamp01(1 - elev * 2);
```

### Performance Considerations
- **Single transform**: Dimetric applied once to worldLayer (no per-sprite cost)
- **Overlay sprites**: Rivers and roads are single sprites each (2 draw calls total)
- **Automatic mipmaps**: Pixi v8 handles mipmap generation for smooth zooming
- **Lazy generation**: Overlays only regenerated when terrain changes

## Usage Examples

### Basic Setup
```typescript
import { Application } from 'pixi.js';
import { generateTerrain, setDimetric } from './terrain/pixiTerrainRenderer';

const app = new Application({ width: 1280, height: 720 });
document.body.appendChild(app.canvas);

// Generate terrain (rivers added automatically)
generateTerrain(app, { seed: 'my-world' });

// Apply dimetric view
setDimetric(app, { scaleY: 0.5, shearX: 0.5 });
```

### Custom River Style
```typescript
import { makeRiversOverlay } from './overworld';

const customRivers = makeRiversOverlay('rivers', riverGen, {
  color: '#3090D0',      // Deeper blue
  foam: '#FFFFFF',       // Pure white foam
  minWidth: 1.0,         // Thinner sources
  maxWidth: 8.0,         // Wider mouths
  foamSlope: 1.2,        // More selective foam
  alpha: 0.85            // Slightly transparent
});

generateTerrain(app, {
  overlays: [customRivers]
});
```

### Adding Roads
```typescript
import { makeRoadsOverlay } from './overworld';

// Define trade routes or quest paths
const tradeRoutes = [
  { 
    points: [{x:200, y:300}, {x:400, y:350}, {x:600, y:320}],
    width: 4.0,
    tint: '#9a7b53',
    alpha: 0.9
  },
  {
    points: [{x:400, y:350}, {x:450, y:500}, {x:480, y:650}],
    width: 3.0,
    tint: '#8a6a4a',
    alpha: 0.85
  }
];

generateTerrain(app, {
  overlays: [
    // Rivers added automatically
    makeRoadsOverlay('roads', tradeRoutes)
  ]
});
```

## Future Enhancements

### Planned Features
- **Bridge detection**: Stamp bridge sprites where roads cross rivers
- **River confluence**: Merge tributaries into main channels
- **Flow indicators**: Animated particles or color gradients
- **Seasonal variation**: Dry riverbeds in summer, flooding in spring
- **Settlement integration**: Roads automatically connect cities
- **Elevation-aware roads**: Switchbacks on steep terrain

### Performance Optimizations
- **Viewport culling**: Only render overlays in visible area
- **LOD system**: Simplify river paths when zoomed out
- **Texture atlasing**: Batch road segments into single texture
- **Worker threads**: Generate overlays in background

## API Reference

### `setDimetric(app: Application, params: DimetricParams): void`
Apply or update dimetric projection parameters.

**Parameters:**
- `app`: Pixi Application instance
- `params`: `{ scaleY: number, shearX: number }`
  - `scaleY`: Y-axis squash factor (0.45-0.65 recommended)
  - `shearX`: X-axis shear per Y pixel (0.35-0.60 recommended)

### `makeRiversOverlay(id: string, rivers: RiverGenerator, style?: Partial<RiverStyle>): TerrainOverlayDefinition`
Create a river overlay from generated river paths.

**Parameters:**
- `id`: Unique overlay identifier
- `rivers`: RiverGenerator instance from terrain generation
- `style`: Optional style overrides
  - `color`: Main river color (default: '#2E90FF')
  - `foam`: Foam highlight color (default: '#BEE3FF')
  - `minWidth`: Width at source in pixels (default: 1.5)
  - `maxWidth`: Width at mouth in pixels (default: 6.0)
  - `foamSlope`: Slope threshold for foam (default: 0.9)
  - `alpha`: Overlay opacity (default: 0.9)

### `makeRoadsOverlay(id: string, roads: Road[]): TerrainOverlayDefinition`
Create a roads overlay from path definitions.

**Parameters:**
- `id`: Unique overlay identifier
- `roads`: Array of road definitions
  - `points`: Array of `{x, y}` coordinates
  - `width`: Line width in pixels (optional, default: 3)
  - `tint`: Road color (optional, default: '#9a7b53')
  - `alpha`: Road opacity (optional, default: 0.9)

### `dimetricToWorld(xd: number, yd: number, params?: DimetricParams): {x: number, y: number}`
Convert dimetric screen coordinates back to world coordinates.

**Parameters:**
- `xd`: Screen X coordinate (after dimetric transform)
- `yd`: Screen Y coordinate (after dimetric transform)
- `params`: Dimetric parameters used for transform (optional, uses default)

**Returns:**
- `{x, y}`: World coordinates (before dimetric transform)

## Troubleshooting

### Rivers not visible
- Check console for "🌊 Generated N rivers" message
- Verify `riverGen.getRivers().length > 0`
- Try increasing river source count in `generateRivers()` call

### Dimetric transform looks wrong
- Verify `worldLayer` exists before calling `setDimetric()`
- Check that `scaleY` is between 0.4-0.7
- Ensure `shearX` is between 0.3-0.7
- Try default values: `{ scaleY: 0.5, shearX: 0.5 }`

### Overlays misaligned with terrain
- Ensure both terrain and overlays are children of `worldLayer`
- Check that overlays use same coordinate system as terrain pixels
- Verify `worldLayer` transform is applied before overlay generation

### Performance issues
- Reduce river source count (100 → 60)
- Simplify river paths (increase segment length threshold)
- Disable foam highlights (set `foamSlope` very high)
- Use fewer road segments
