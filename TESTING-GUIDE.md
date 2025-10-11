# 🧪 Pixi.js Testing Guide

## Quick Start

The dev server should be compiling at http://localhost:3000

If the browser isn't open yet, navigate to: **http://localhost:3000**

## Testing Steps

### 1. Navigate to Smooth Map
- Click **"Main Menu"** (if not already there)
- Click **"Smooth Map"** button

### 2. You Should See
- **Pixi.js (GPU)** renderer active (blue indicator in top-right)
- Organic terrain rendering with biomes
- FPS counter in top-left (should show 55-60 fps)
- Info overlay in bottom-left showing:
  - 🎮 Controls
  - 📍 Position
  - 🎨 GPU: Pixi.js v8
  - Chunks: [number]
  - 💾 Cache: [number] samples
  - ⚡ FPS: [green number]

### 3. Test Movement
- **WASD** or **Arrow Keys**: Move around
- Should be smooth with momentum physics
- Watch terrain chunks load as you explore

### 4. Test Zoom
- **Mouse Wheel**: Zoom in/out
  - ⚠️ Should zoom (not move map up/down like before!)
  - Should center on cursor position

### 5. Test Panning
- **Click and Drag**: Pan the map
  - Should have smooth deceleration when you release
  - Camera should glide to a stop

### 6. Compare Renderers (F9)
- **Press F9**: Toggle to Canvas 2D
  - Indicator changes to green "Canvas 2D"
  - FPS might drop slightly (30-45 fps)
- **Press F9 again**: Toggle back to Pixi.js
  - FPS should jump back to 55-60
  - Smoother rendering

### 7. Hide UI (F10)
- **Press F10**: Hide the renderer toggle
- **Press F10 again**: Show it again

## What To Look For

### ✅ Good Signs
- **FPS: 55-60** (green) consistently
- **Smooth movement** with WASD
- **Zoom works** with mouse wheel
- **Terrain loads** as you move around
- **No white screens** or crashes
- **Chunks increase** as you explore
- **Cache grows** to ~1000-5000 samples

### ⚠️ Potential Issues
- **FPS < 30**: Check if too many chunks loaded
- **Zoom moves map up/down**: Old code still active (refresh page)
- **Black screen**: WebGL not available (should fallback to Canvas)
- **Stuttering**: Possible memory issue (check Chunks count)

### 🐛 If You See Problems
1. **Black/White Screen**:
   - Open console (F12)
   - Look for WebGL errors
   - Try pressing F9 to switch to Canvas 2D

2. **Low FPS**:
   - Check Chunks count (should stay <100)
   - Check Cache size (should stay <20000)
   - Try zooming in (fewer chunks visible)

3. **Mouse Wheel Still Pans**:
   - Hard refresh: Ctrl+Shift+R
   - Clear cache and reload

4. **Crashes When Moving**:
   - Check console for errors
   - Look for "ResizeObserver" errors (should be fixed)

## Performance Comparison

### Expected Results

| Metric | Canvas 2D | Pixi.js (GPU) |
|--------|-----------|---------------|
| **FPS (idle)** | 40-45 | 55-60 |
| **FPS (moving)** | 30-40 | 55-60 |
| **Zoom quality** | Good | Excellent |
| **Chunk count** | N/A | 20-50 |
| **Cache size** | 5000-10000 | 5000-20000 |

### Canvas 2D (F9 to toggle)
- Cell-based rendering
- Manual terrain caching
- ~8px logical cells
- Good quality, acceptable performance

### Pixi.js GPU (Default)
- Chunk-based streaming
- Automatic culling
- ~4 world unit cells
- Excellent quality, high performance

## Advanced Testing

### Stress Test
1. Hold **W** for 30 seconds straight
2. Watch FPS - should stay 50+
3. Check Chunks - should auto-remove distant ones
4. Check Cache - should cap at 20000

### Zoom Test
1. Zoom all the way in (wheel scroll down)
2. Zoom all the way out (wheel scroll up)
3. FPS should remain stable
4. Cursor position should stay centered

### Renderer Switching
1. Move to an interesting biome area
2. Press F9 (switch to Canvas)
3. Note the FPS
4. Press F9 (switch to Pixi)
5. Note the FPS difference (should be +10-20 fps)

## Console Commands (F12)

If you want to debug, open console and check for:

```javascript
// Pixi initialization
🌱 [Pixi] Initializing terrain generator with seed: ...
✅ [Pixi] Terrain generator ready!
🎬 [Pixi] Initializing Pixi application...
✅ [Pixi] Application initialized!

// Should NOT see these (old infinite resize bug):
❌ Canvas growing: 300x150 -> 900x450
❌ ResizeObserver loop
```

## What's Different From Before

### Fixed Issues ✅
1. **Mouse wheel now zooms** (not pans up/down)
2. **Smoother rendering** (8px → 4 world units)
3. **No infinite resize loop** (ResizeObserver fixed)
4. **Better performance** (GPU acceleration)
5. **Automatic culling** (memory efficient)

### New Features ⭐
1. **GPU rendering** with Pixi.js
2. **Chunk streaming** (loads as you explore)
3. **Runtime comparison** (F9 to toggle)
4. **Momentum physics** (smooth movement)
5. **Better zoom** (cursor-centered)

## Reporting Results

Please check:
- [ ] FPS on Pixi.js: ____
- [ ] FPS on Canvas 2D: ____
- [ ] Mouse wheel zooms (not pans): Yes / No
- [ ] Movement is smooth: Yes / No
- [ ] Terrain loads correctly: Yes / No
- [ ] F9 toggle works: Yes / No
- [ ] Any errors in console: Yes / No

Let me know what you see!
