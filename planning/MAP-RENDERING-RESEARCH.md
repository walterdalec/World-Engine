# Map Rendering Research - Open Source Solutions

**Date**: October 10, 2025  
**Context**: Current SmoothWorldMap uses raw Canvas 2D API. Looking for open-source libraries to improve rendering quality and performance.

---

## Current Implementation Status

**What Works**:
- ✅ Ref-based 60fps rendering with Canvas 2D
- ✅ DPR-aware (3x Retina support)
- ✅ Terrain caching (10,000 entries)
- ✅ 8px logical cell size (24 device pixels @ 3x DPR)
- ✅ Image smoothing enabled
- ✅ Mouse wheel zoom, WASD movement, drag-to-pan

**Pain Points**:
- Cell-based rendering creates visible grid artifacts during movement
- Limited interpolation between terrain samples
- No GPU acceleration for large maps
- Manual biome color blending
- Performance scales linearly with viewport size

---

## Open Source Solutions (Recommended)

### 1. **Pixi.js** (MIT License) ⭐ TOP CHOICE
**URL**: https://github.com/pixijs/pixijs  
**Stars**: ~43k | **Bundle**: ~500KB minified | **Last Update**: Active (v8.x)

**Why It Fits**:
- WebGL-accelerated 2D rendering with Canvas fallback
- Sprite batching and texture atlases (perfect for tiled terrain)
- Built-in filters (blur, noise, color matrix) for terrain effects
- Mature ecosystem with React bindings (`@pixi/react`)
- Excellent performance for large scrolling maps
- Supports our retro aesthetic with pixel-perfect rendering

**Integration Strategy**:
```typescript
// Replace raw canvas with Pixi viewport
import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { Viewport } from 'pixi-viewport'; // Smooth pan/zoom

// Terrain as tiled sprites with GPU batching
const terrainLayer = new Container();
for (let y = 0; y < mapHeight; y++) {
  for (let x = 0; x < mapWidth; x++) {
    const tile = Sprite.from(biomeTexture);
    tile.tint = terrainColor(x, y); // GPU color tinting
    terrainLayer.addChild(tile);
  }
}

// Automatic culling (only renders visible tiles)
viewport.addChild(terrainLayer);
```

**Pros**:
- GPU-accelerated (10-100x faster than Canvas 2D for large maps)
- Built-in camera system with smooth pan/zoom
- Texture caching and automatic culling
- Advanced filters (fog of war, lighting, blur)
- React bindings available

**Cons**:
- Larger bundle size (~500KB vs our current ~0KB)
- Learning curve for Pixi architecture
- Requires texture atlases for best performance

**Compatibility**:
- ✅ MIT License (safe for our project)
- ✅ Works with our hex battle system (can render both smooth overworld and hex grids)
- ✅ Supports our retro aesthetic (pixel-perfect mode, nearest-neighbor filtering)

---

### 2. **Leaflet** (BSD-2-Clause License)
**URL**: https://github.com/Leaflet/Leaflet  
**Stars**: ~41k | **Bundle**: ~150KB | **Last Update**: Active

**Why It Fits**:
- Industry-standard map library (used by OpenStreetMap, MapBox)
- Tile-based rendering with smooth panning
- Built-in layer management (terrain, settlements, fog of war)
- Plugin ecosystem (heatmaps, markers, clustering)

**Integration Strategy**:
```typescript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom tile layer from our terrain generator
const terrainLayer = L.TileLayer.extend({
  createTile(coords, done) {
    const tile = document.createElement('canvas');
    tile.width = 256;
    tile.height = 256;
    
    // Render our procedural terrain to this tile
    const ctx = tile.getContext('2d');
    for (let y = 0; y < 256; y += 8) {
      for (let x = 0; x < 256; x += 8) {
        const worldPos = this.tileToWorld(coords, x, y);
        const sample = sampleOverworld(worldPos);
        ctx.fillStyle = terrainColor(sample);
        ctx.fillRect(x, y, 8, 8);
      }
    }
    
    done(null, tile);
    return tile;
  }
});
```

**Pros**:
- Proven tile-based architecture
- Excellent for large worlds (infinite scrolling)
- Rich plugin ecosystem
- Lightweight (~150KB)
- Handles all camera/viewport management

**Cons**:
- Designed for geographic maps (needs adaptation for game worlds)
- Less GPU acceleration than Pixi
- May be overkill for our use case

---

### 3. **Konva.js** (MIT License)
**URL**: https://github.com/konvajs/konva  
**Stars**: ~11k | **Bundle**: ~200KB | **Last Update**: Active

**Why It Fits**:
- Canvas 2D wrapper with scene graph
- Layer-based rendering (terrain, units, UI)
- Built-in caching and optimization
- React bindings (`react-konva`)

**Integration Strategy**:
```typescript
import { Stage, Layer, Rect } from 'react-konva';

// Terrain as cached layer
<Stage width={800} height={600}>
  <Layer cache={true}> {/* Cache terrain layer */}
    {terrainCells.map(cell => (
      <Rect
        key={cell.key}
        x={cell.x}
        y={cell.y}
        width={8}
        height={8}
        fill={cell.color}
      />
    ))}
  </Layer>
  <Layer> {/* Dynamic player/units */}
    <Circle x={playerX} y={playerY} radius={10} fill="red" />
  </Layer>
</Stage>
```

**Pros**:
- Simpler than Pixi (less abstraction)
- Good React integration
- Built-in shape primitives
- Layer caching reduces redraws

**Cons**:
- Canvas 2D only (no WebGL acceleration)
- Less mature than Pixi/Leaflet
- Performance ceiling lower than Pixi

---

### 4. **Three.js** (MIT License) - Future 3D Option
**URL**: https://github.com/mrdoob/three.js  
**Stars**: ~101k | **Bundle**: ~600KB | **Last Update**: Active

**Why Consider**:
- Full WebGL/WebGPU 3D rendering
- Can render 2D maps as textured planes (extreme performance)
- Path to future 3D battles (Brigandine-style isometric view)
- Shader-based terrain generation

**Integration Strategy** (2D map as 3D plane):
```typescript
import * as THREE from 'three';

// Render terrain as single textured plane with shader
const geometry = new THREE.PlaneGeometry(1000, 1000, 256, 256);
const material = new THREE.ShaderMaterial({
  uniforms: {
    seed: { value: seedValue },
    playerPos: { value: new THREE.Vector2(x, y) }
  },
  vertexShader: terrainVertexShader,
  fragmentShader: terrainFragmentShader
});

// GPU samples terrain noise in fragment shader (infinite detail)
const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);
```

**Pros**:
- Ultimate performance (entire terrain in GPU shader)
- Path to 3D battles
- Advanced effects (lighting, shadows, fog)
- Industry standard

**Cons**:
- Massive bundle size (~600KB+)
- Overkill for 2D map
- Steeper learning curve
- Shader programming required for best results

---

## Performance Comparison

| Library | Render Method | Est. FPS (1920x1080 @ 3x DPR) | Bundle Size | GPU Accel |
|---------|--------------|--------------------------------|-------------|-----------|
| **Raw Canvas 2D** (current) | Cell-based rects | ~30-45 fps | 0KB | ❌ No |
| **Pixi.js** | GPU sprite batching | ~60 fps | 500KB | ✅ Yes |
| **Leaflet** | Tile caching | ~45-60 fps | 150KB | ⚡ Partial |
| **Konva** | Canvas with caching | ~40-50 fps | 200KB | ❌ No |
| **Three.js** | GPU shader | ~60 fps | 600KB+ | ✅ Yes |

---

## Recommendation: Pixi.js

**Why Pixi.js is the best fit**:

1. **Performance**: GPU-accelerated sprite batching handles 10,000+ tiles at 60fps
2. **Flexibility**: Works for both smooth overworld AND hex battles
3. **Ecosystem**: Active community, React bindings, proven in games
4. **License**: MIT (safe for our project)
5. **Learning Curve**: Moderate (easier than Three.js, more powerful than Konva)
6. **Bundle Size**: 500KB is acceptable for the performance gains

**Implementation Plan** (2-3 days):

### Phase 1: Basic Pixi Integration (Day 1)
- [ ] Install `pixi.js` and `pixi-viewport`
- [ ] Create `PixiWorldMap` component wrapper
- [ ] Port camera system (pan/zoom) to Pixi Viewport
- [ ] Render terrain as tiled sprites with GPU batching

### Phase 2: Terrain Optimization (Day 2)
- [ ] Create texture atlas from biome colors
- [ ] Implement chunk-based rendering (load/unload tiles)
- [ ] Add GPU color tinting for biome variations
- [ ] Enable automatic culling (only render visible tiles)

### Phase 3: Visual Polish (Day 3)
- [ ] Add interpolation filter for smooth terrain transitions
- [ ] Implement fog of war with Pixi displacement filter
- [ ] Add player glow/shadow with GPU filters
- [ ] Performance profiling and optimization

**Code Structure**:
```
src/features/world/
├── components/
│   ├── SmoothWorldMap.tsx          # Current (keep as fallback)
│   ├── PixiWorldMap.tsx            # New Pixi implementation
│   └── WorldMapRouter.tsx          # Toggle between implementations
├── rendering/
│   ├── PixiRenderer.ts             # Pixi setup and viewport
│   ├── TerrainAtlas.ts             # Texture atlas generation
│   ├── ChunkManager.ts             # Tile streaming
│   └── PixiFilters.ts              # Custom shaders/filters
└── terrain/
    └── terrainGenerator.ts         # Existing (no changes)
```

**Fallback Strategy**:
- Keep current Canvas 2D implementation as fallback
- Detect WebGL support at runtime
- Toggle in settings: `useGPURendering: true/false`

---

## Alternative: Incremental Canvas 2D Improvements

**If we want to stick with Canvas 2D** (no dependencies), here are optimizations:

1. **Offscreen Canvas** for terrain layer (pre-render chunks)
   ```typescript
   const offscreen = new OffscreenCanvas(256, 256);
   // Render chunk once, then drawImage() to main canvas
   ```

2. **ImageData manipulation** (faster than fillRect)
   ```typescript
   const imageData = ctx.createImageData(width, height);
   for (let i = 0; i < imageData.data.length; i += 4) {
     imageData.data[i] = r;     // Red
     imageData.data[i+1] = g;   // Green
     imageData.data[i+2] = b;   // Blue
     imageData.data[i+3] = 255; // Alpha
   }
   ctx.putImageData(imageData, 0, 0);
   ```

3. **Web Workers** for terrain sampling (offload CPU)
   ```typescript
   // Worker samples terrain, main thread just renders
   worker.postMessage({ chunk: [x, y, width, height] });
   worker.onmessage = (e) => renderChunk(e.data.colors);
   ```

4. **Smaller cells with bilinear interpolation**
   - Sample at 16px grid
   - Interpolate colors between samples
   - Smooth gradients without 4x more samples

---

## Decision Matrix

| Criteria | Canvas 2D (current) | Canvas 2D (optimized) | Pixi.js | Three.js |
|----------|---------------------|----------------------|---------|----------|
| **Performance** | 😐 30-45 fps | 😊 45-55 fps | 😍 60 fps | 😍 60 fps |
| **Bundle Size** | ✅ 0KB | ✅ 0KB | 😐 500KB | 😞 600KB+ |
| **Implementation Time** | ✅ Done | 😊 1 day | 😐 2-3 days | 😞 1 week |
| **Flexibility** | 😐 Limited | 😐 Limited | 😍 Excellent | 😍 Excellent |
| **Learning Curve** | ✅ None | ✅ None | 😊 Moderate | 😞 Steep |
| **Future 3D Battles** | ❌ No | ❌ No | 😐 Possible | ✅ Yes |
| **Retro Aesthetic** | ✅ Yes | ✅ Yes | ✅ Yes | 😊 Yes |

---

## Next Steps

**Recommendation**: Start with **Canvas 2D optimizations** (1 day) to improve current system, then evaluate **Pixi.js migration** (2-3 days) if we need more performance.

**Immediate Wins** (today):
1. Implement offscreen canvas chunk caching
2. Use ImageData for faster pixel manipulation
3. Add bilinear interpolation between terrain samples

**Future Upgrade** (when battles are stable):
1. Migrate to Pixi.js for GPU acceleration
2. Add advanced effects (fog of war, lighting, particles)
3. Prepare for 3D battle transitions

---

**Questions for User**:
- Do you want to stick with pure Canvas 2D + optimizations (no dependencies)?
- Or should we integrate Pixi.js for GPU acceleration (500KB bundle increase)?
- Are you interested in 3D battles eventually (would influence Three.js consideration)?
