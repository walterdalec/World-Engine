# Dimetric Viewing Angles - Usage Examples

## How to Change the View from Top-Down to Dimetric

The dimetric projection is **already enabled by default** when you generate terrain using `pixiTerrainRenderer.ts`. However, you can adjust the angle or disable it entirely.

## Where to Apply the Transform

### Option 1: In Your Map Component (Recommended)

Find where you call `generateTerrain()` and add `setDimetric()` right after:

```typescript
import { generateTerrain, setDimetric } from '../features/world/terrain/pixiTerrainRenderer';

// In your component's useEffect or initialization:
const pixiApp = new Application({ width: 1280, height: 720 });

// Generate terrain (already has default dimetric)
generateTerrain(pixiApp, { seed: 'my-world' });

// Adjust to your preferred angle (optional)
setDimetric(pixiApp, { scaleY: 0.5, shearX: 0.5 });
```

### Option 2: Using the Integrated Campaign System

If you're using the integrated campaign from `src/features/world/components/IntegratedCampaignDemo.tsx`, the dimetric transform is already applied automatically.

## Preset Viewing Angles

### Classic Isometric (Default)
```typescript
setDimetric(pixiApp, { scaleY: 0.5, shearX: 0.5 });
```
**Effect**: Balanced 3D appearance, like Civilization or Age of Empires

### Steep Angle (More Dramatic)
```typescript
setDimetric(pixiApp, { scaleY: 0.45, shearX: 0.6 });
```
**Effect**: More pronounced tilt, emphasizes terrain height

### Shallow Angle (Closer to Top-Down)
```typescript
setDimetric(pixiApp, { scaleY: 0.55, shearX: 0.4 });
```
**Effect**: Less tilted, easier to judge distances

### Very Steep (Strategy Game Style)
```typescript
setDimetric(pixiApp, { scaleY: 0.4, shearX: 0.65 });
```
**Effect**: Maximum tilt, dramatic perspective

### Disable Dimetric (Pure Top-Down)
```typescript
setDimetric(pixiApp, { scaleY: 1.0, shearX: 0.0 });
```
**Effect**: Completely flat top-down view, no perspective

## Live Adjustment Example

Create UI controls to adjust the angle in real-time:

```typescript
import { setDimetric } from '../features/world/terrain/pixiTerrainRenderer';
import { useState } from 'react';

function TerrainViewControls({ pixiApp }) {
  const [scaleY, setScaleY] = useState(0.5);
  const [shearX, setShearX] = useState(0.5);

  const handleScaleChange = (value: number) => {
    setScaleY(value);
    setDimetric(pixiApp, { scaleY: value, shearX });
  };

  const handleShearChange = (value: number) => {
    setShearX(value);
    setDimetric(pixiApp, { scaleY, shearX: value });
  };

  return (
    <div style={{ position: 'absolute', top: 20, right: 20 }}>
      <label>
        Y Squash: {scaleY.toFixed(2)}
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.05"
          value={scaleY}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
        />
      </label>
      <label>
        X Shear: {shearX.toFixed(2)}
        <input
          type="range"
          min="0.0"
          max="0.8"
          step="0.05"
          value={shearX}
          onChange={(e) => handleShearChange(parseFloat(e.target.value))}
        />
      </label>
    </div>
  );
}
```

## Parameter Guide

### `scaleY` (Vertical Squash)
- **Range**: 0.3 to 1.0
- **Effect**: How much the Y-axis is compressed
- **Lower values** = More tilted (0.4 = steep)
- **Higher values** = Less tilted (0.8 = shallow)
- **1.0** = No compression (top-down)

### `shearX` (Horizontal Shear)
- **Range**: 0.0 to 0.8
- **Effect**: How much the top is shifted right relative to bottom
- **Lower values** = Less slant (0.2 = subtle)
- **Higher values** = More slant (0.6 = dramatic)
- **0.0** = No shear (no horizontal skew)

## Visual Reference

```
Top-Down (No Dimetric):
scaleY: 1.0, shearX: 0.0
┌─────────┐
│  MAP    │
│         │
└─────────┘

Classic Isometric:
scaleY: 0.5, shearX: 0.5
    ╱─────────╲
   ╱   MAP    ╲
  ╱___________╲

Steep Angle:
scaleY: 0.4, shearX: 0.6
      ╱─────────╲
     ╱   MAP    ╲
    ╱___________╲

Shallow Angle:
scaleY: 0.6, shearX: 0.3
  ╱─────────╲
 ╱   MAP    ╲
╱___________╲
```

## Troubleshooting

### "I don't see any change"
- Make sure you're calling `setDimetric()` **after** `generateTerrain()`
- Verify the `pixiApp` reference is correct
- Try extreme values first (scaleY: 0.3, shearX: 0.7) to confirm it's working

### "Rivers/overlays are misaligned"
- The dimetric transform is applied to `worldLayer`, which contains both terrain and overlays
- They should automatically align - if not, ensure all visual elements are children of the correct layer

### "Performance issues with dimetric"
- The transform itself has near-zero performance cost (single GPU matrix)
- If you experience issues, they're likely from other sources (river generation, overlay rendering)

## Finding the Right Angle

Everyone has different preferences! Try these steps:

1. **Start with default** (0.5, 0.5)
2. **Adjust Y first** - find your preferred tilt amount
3. **Then adjust X** - fine-tune the slant
4. **Test with gameplay** - make sure it feels good during actual play

## Save Your Preferences

Store your preferred angle in settings:

```typescript
// In your settings/config file
export const TERRAIN_VIEW_PREFERENCES = {
  dimetric: {
    scaleY: 0.5,
    shearX: 0.5
  }
};

// Apply when initializing terrain
import { TERRAIN_VIEW_PREFERENCES } from './config';

generateTerrain(pixiApp, { seed: 'world' });
setDimetric(pixiApp, TERRAIN_VIEW_PREFERENCES.dimetric);
```

## Summary

- **Default**: Dimetric is already enabled (0.5, 0.5)
- **Adjust**: Use `setDimetric()` to change angles
- **Disable**: Set `scaleY: 1.0, shearX: 0.0` for pure top-down
- **Experiment**: Try different values to find what you like!
