# Interactive Camera Controls

## Overview
The World Engine now features **interactive dimetric camera controls** that let you adjust the viewing angle in real-time using your mouse!

## Controls

### Basic Navigation
- **WASD Keys**: Move your character around the world
- **Left Mouse Button + Drag**: Pan the camera view
- **Mouse Wheel**: Zoom in/out

### Dimetric Camera Angle (NEW!)
- **Right Mouse Button + Drag**: Adjust the camera viewing angle
  - **Drag Left/Right**: Rotate the camera angle (adjusts horizontal slant)
  - **Drag Up/Down**: Change the viewing steepness (vertical compression)

### Visual Feedback
The bottom-left HUD shows:
- Current camera parameters: `scaleY` (vertical compression) and `shearX` (horizontal slant)
- Real-time updates as you adjust the view

## How It Works

### Technical Details
The dimetric projection uses two parameters:

1. **`scaleY`** (0.3 - 1.0): Vertical compression
   - Lower values = steeper, more dramatic angle
   - Higher values = flatter, approaching top-down
   - Default: 0.5 (classic isometric)

2. **`shearX`** (0.0 - 0.8): Horizontal slant
   - Lower values = less slanted
   - Higher values = more rotated perspective
   - Default: 0.5 (classic isometric)

### Mouse Sensitivity
- **2 pixels of drag = 0.001 parameter change**
- Smooth, responsive control
- Parameters automatically clamped to safe ranges

### Visual Examples

```
Top-Down View:
scaleY: 1.0, shearX: 0.0
┌─────┐
│     │  (No tilt, like looking straight down)
└─────┘

Classic Isometric:
scaleY: 0.5, shearX: 0.5
  ╱───╲
 ╱     ╲  (45° angle, traditional isometric)
╱───────╲

Steep Angle:
scaleY: 0.4, shearX: 0.65
   ╱──╲
  ╱    ╲  (Dramatic perspective, more 3D-like)
 ╱──────╲

Shallow Angle:
scaleY: 0.55, shearX: 0.4
 ╱─────╲
╱       ╲  (Subtle tilt, almost top-down)
─────────
```

## Integration

### Where It's Used
- **PixiWorldMap Component**: Primary world map exploration view
- **Campaign System**: Full integration with character movement and encounters

### Code Location
- **Implementation**: `src/features/world/components/PixiWorldMap.tsx`
- **Core System**: `src/features/world/overworld/dimetric.ts`
- **Renderer Integration**: `src/features/world/terrain/pixiTerrainRenderer.ts`

### API Usage
```typescript
import { setDimetric } from '../terrain/pixiTerrainRenderer';

// Adjust camera angle programmatically
setDimetric(app, { scaleY: 0.45, shearX: 0.6 });

// Reset to classic isometric
setDimetric(app, { scaleY: 0.5, shearX: 0.5 });

// Disable dimetric (pure top-down)
setDimetric(app, { scaleY: 1.0, shearX: 0.0 });
```

## Design Philosophy

### Player Agency
Right-click drag gives players **direct control** over their viewing angle, letting them:
- Find the perspective they're most comfortable with
- Adjust for different gameplay situations (combat vs. exploration)
- Personalize their visual experience

### Game Mechanics Integration
The camera controls are **tied directly to game mechanics**:
- Adjustments apply to the entire world layer (terrain + overlays + units)
- Real-time updates with zero performance cost (single GPU matrix)
- Persistent across map regeneration and zooming
- Smooth, responsive feel with proper mouse capture

### No UI Clutter
Instead of sliders or buttons, the system uses:
- **Contextual controls**: Right-click is naturally associated with camera manipulation in many games
- **Direct manipulation**: Move mouse = see immediate visual feedback
- **Minimal HUD**: Only shows values, doesn't require UI interaction

## Future Enhancements

### Potential Additions
- **Preset Hotkeys**: Press `1-5` to snap to preset viewing angles
- **Save Preference**: Remember player's preferred angle between sessions
- **Per-Context Angles**: Different defaults for world map vs. tactical battles
- **Smooth Transitions**: Animated lerp when switching between presets

### Battle System Integration
When the tactical battle system is integrated, we can:
- Use steeper angles for combat (better unit visibility)
- Flatter angles for strategic map planning
- Smooth camera transitions between exploration and combat modes

## Troubleshooting

### Right-Click Doesn't Work
- **Check**: Make sure you're clicking on the canvas, not UI elements
- **Context Menu**: The system automatically prevents the browser context menu

### Camera Feels Too Sensitive
- **Code Location**: `PixiWorldMap.tsx` line ~312
- **Adjustment**: Change `deltaX * 0.002` to `deltaX * 0.001` for half speed

### Want Different Ranges
- **Code Location**: `PixiWorldMap.tsx` line ~315-316
- **Defaults**: Adjust `Math.max/Math.min` values to change parameter limits

## Performance

### Zero Overhead
- **GPU-Accelerated**: Uses Pixi.js transform matrix (single GPU operation)
- **No Re-Render**: Changes transform without redrawing terrain
- **Smooth 60fps**: No impact on frame rate even during adjustment

### Memory Efficient
- **Stateless Transform**: No additional buffers or textures needed
- **Minimal State**: Only stores 2 float values (`scaleY`, `shearX`)

## Accessibility

### Mouse-Free Alternative
Currently requires mouse for adjustment. Future versions could add:
- Keyboard shortcuts for preset angles
- Gamepad right-stick for camera control
- Settings menu with slider controls

## Credits

### Inspiration
- **Brigandine**: Classic isometric tactical view
- **Mount & Blade**: Dynamic camera control
- **Age of Empires**: Rotatable camera systems

### Implementation
- **Pixi.js v8**: Modern WebGL rendering pipeline
- **Transform Matrix Math**: Clean, efficient 2D projection
- **React Integration**: State-driven UI updates
