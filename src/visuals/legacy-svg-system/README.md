# Legacy SVG Portrait System

This folder contains the original complex SVG-based portrait generation system that was used in World Engine v1.x.

## Moved Files

- **PortraitPreview.tsx** - Original React component for SVG portraits
- **service.ts** - Main portrait generation service with complex rendering pipeline
- **renderer2d.tsx** - SVG rendering and layering system
- **assets.ts** - Asset management and URL construction for SVG files
- **manifest.ts** - Asset catalog and manifest management
- **preloader.ts** - Portrait preloading system (caused console spam)
- **svgUtils.ts** - SVG optimization and manipulation utilities
- **classmap.ts** - Class/species visual theme mapping
- **seed.ts** - Seeded random generation for portrait variations
- **PortraitTest.tsx** - Legacy portrait test page

## Why Moved

The SVG system was causing several issues:
- Complex asset management requiring manifests and catalogs
- Failed fetch errors for missing SVG files (hair/long_wavy.svg, etc.)
- Console spam from preloading attempts
- Slow performance due to complex layering and generation
- Difficult to debug and maintain

## Current Status

**Replaced by**: Simple PNG portrait system in main visuals folder
- Uses `SimplePortraitPreview.tsx` for React integration
- Direct PNG layering approach via `simple-portraits.ts`
- Clean asset structure in `public/assets/portraits-new/`

## Future Use

This legacy system is preserved for:
- Reference implementation for complex portrait features
- Future development if advanced SVG generation is needed
- Historical context and learning from the original approach

## Integration Notes

To use the legacy system again:
1. Move desired files back to main visuals folder
2. Update imports in index.ts
3. Handle the asset loading and console spam issues
4. Ensure SVG assets exist in public/assets/portraits/

The legacy system expects the original SVG asset structure and may require significant updates to work with current game state.