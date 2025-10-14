# Quick Start Guide - Dimetric Terrain & River Overlays

## What You Just Got

### 🎨 Visual Enhancements
1. **Dimetric/Isometric View** - Terrain tilted like classic strategy games (Civilization, Age of Empires style)
2. **Beautiful Rivers** - Thin mountain streams → wide lowland channels with white foam on rapids
3. **Marshy Deltas** - Rivers that don't reach the ocean create natural-looking swamp fans
4. **Riverbank Marshes** - Swamps automatically form along river edges

### 🚀 How to Use It

#### Automatic (Default)
Everything works automatically! Just start a new campaign:
1. Go to http://localhost:3000
2. Start a new campaign
3. Rivers will automatically have:
   - Width ramping (thin → wide)
   - Foam highlights on steep sections
   - Marshy deltas where they stop
   - Swamps along banks

#### Adjust the Viewing Angle (Optional)
To change the dimetric tilt angle, you can modify the terrain renderer:

```typescript
// In the file where you initialize terrain rendering
import { setDimetric } from './features/world/terrain/pixiTerrainRenderer';

// Classic isometric (default)
setDimetric(pixiApp, { scaleY: 0.5, shearX: 0.5 });

// Steeper angle (more dramatic)
setDimetric(pixiApp, { scaleY: 0.45, shearX: 0.6 });

// Shallower angle (more top-down)
setDimetric(pixiApp, { scaleY: 0.55, shearX: 0.4 });
```

#### Add Custom Roads (Optional)
```typescript
import { makeRoadsOverlay } from './features/world/overworld';

const roads = [
  { 
    points: [{x: 200, y: 300}, {x: 400, y: 350}, {x: 600, y: 320}],
    width: 4,
    tint: '#9a7b53',  // Brown dirt road
    alpha: 0.9
  }
];

// Add when generating terrain
generateTerrain(app, {
  seed: 'my-world',
  overlays: [makeRoadsOverlay('roads', roads)]
});
```

## 🔍 What to Look For

### In the Console
When you start a new campaign, you should see:
```
🌊 Generated 95 rivers with 6000+ segments (350+ erosions)
Average: 63.2 segments per river, 3.7 erosions per river
🏔️ Terrain elevation range: -0.842 to 1.456 (163800 samples)
📊 Mountain threshold: 0.15, Snow threshold: 0.25
```

### On the Map
- **Blue rivers** flowing from mountains to lakes/ocean
- **Widening paths** as rivers flow downstream
- **White foam** on steep mountain rapids
- **Green swamp fans** where rivers end in lowlands (deltas)
- **Marsh areas** naturally forming along riverbanks
- **Isometric tilt** making the map feel 3D

## 📐 Technical Details

### Files Added
```
src/features/world/overworld/
├── dimetric.ts                    # Transform utilities
├── index.ts                       # Clean exports
├── README.md                      # Full documentation
└── overlays/
    ├── rivers.ts                  # River overlay generator
    └── roads.ts                   # Road overlay generator
```

### Files Modified
```
src/features/world/terrain/pixiTerrainRenderer.ts
- Added worldLayer container (parent of terrain + overlays)
- Applied dimetric transform to worldLayer
- Integrated automatic river overlay
- Added marsh bias near rivers
- Exported setDimetric() function
```

### Architecture
```
stage
└── worldLayer (dimetric transform applied here)
    ├── terrainLayer (base terrain sprite)
    └── overlayLayer (rivers + roads)
```

## 🎯 Configuration Options

### River Style
Located in `src/features/world/overworld/overlays/rivers.ts`:

```typescript
const DEFAULT_RIVER_STYLE = {
  color: '#2E90FF',    // Main river blue
  foam: '#BEE3FF',     // White foam on rapids
  minWidth: 1.5,       // Thin mountain streams
  maxWidth: 6.0,       // Wide lowland channels
  foamSlope: 0.9,      // How steep for foam (bigger = less foam)
  alpha: 0.9           // River opacity
};
```

### Dimetric Angle
Located in `src/features/world/overworld/dimetric.ts`:

```typescript
const DIMETRIC_DEFAULT = { 
  scaleY: 0.5,    // Y-axis squash (0.45-0.65 recommended)
  shearX: 0.5     // X-axis shear (0.35-0.60 recommended)
};
```

### Marsh Bias
Located in `src/features/world/terrain/pixiTerrainRenderer.ts` (line ~430):

```typescript
const nearRiver = riverGen.isRiver(x, y) || riverGen.isRiver(x+1, y) || riverGen.isRiver(x, y+1);
const swampBoost = nearRiver ? 0.15 : 0.0;  // Increase for more marsh
```

## 🐛 Troubleshooting

### "Rivers look the same as before"
- Make sure you started a **new campaign** (old saves use old generation)
- Check console for "🌊 Generated N rivers" message
- Try refreshing the page (Ctrl+F5 for hard refresh)

### "Dimetric angle looks wrong"
- The default `{ scaleY: 0.5, shearX: 0.5 }` is classic isometric
- Try adjusting: more scaleY = flatter, less scaleY = steeper
- Try adjusting: more shearX = more slanted, less shearX = less slanted

### "No marshy deltas"
- Deltas only appear when rivers **don't reach the ocean**
- Check that rivers are terminating on land (elevation > seaLevel)
- Try generating more rivers (increase count in pixiTerrainRenderer.ts line ~376)

### "Performance issues"
- Reduce river count: `riverGen.generateRivers(..., 60)` instead of 100
- Disable foam: Set `foamSlope: 999` to skip foam rendering
- Simplify roads: Use fewer points in road paths

## 📚 Full Documentation

For complete technical details, see:
- **Usage Guide**: `src/features/world/overworld/README.md`
- **Implementation Summary**: `DIMETRIC-IMPLEMENTATION.md` (root directory)
- **API Reference**: Both README files above

## 🎉 What's Next?

### Immediate Use
The system is **fully automatic** and ready to use. Just:
1. Start a new campaign
2. Observe the beautiful rivers with width variation and deltas
3. Optionally adjust `setDimetric()` to change viewing angle

### Future Enhancements (Not Yet Implemented)
- Bridge detection where roads cross rivers
- River confluence (tributaries merging)
- Animated flow indicators
- Seasonal dry riverbeds
- Elevation-aware road switchbacks

### Customization Ideas
- Adjust river colors for different biomes (desert = dry brown, arctic = icy blue)
- Add waterfalls where rivers drop steep elevations
- Create main roads connecting settlements
- Add quest markers along roads
- Generate bridge sprites at river crossings

## ✅ Success Indicators

You know it's working when you see:
- ✅ Console shows "Generated 95 rivers with 6000+ segments"
- ✅ Blue rivers flow from mountains to water/lowlands
- ✅ Rivers get wider as they flow downstream
- ✅ White foam appears on steep mountain rapids
- ✅ Green swamp fans appear where rivers terminate on land
- ✅ Marshes naturally form along riverbanks
- ✅ Map has slight isometric tilt (or your custom angle)
- ✅ No console errors or warnings
- ✅ Smooth 60fps performance

Enjoy your enhanced terrain! 🎮✨
