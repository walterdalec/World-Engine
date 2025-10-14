import {
    Application,
    Container,
    Sprite,
    Texture
} from 'pixi.js';
import { ValueNoise2D, DomainWarp } from '../../../proc/noise';
import { RiverGenerator } from './riverGenerator';
import { applyDimetric, DIMETRIC_DEFAULT, type DimetricParams } from '../overworld/dimetric';
import { makeRiversOverlay } from '../overworld/overlays/rivers';
// import { makeRoadsOverlay } from '../overworld/overlays/roads'; // Available for future use

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const DEFAULT_SEED = 'world-engine';
const DEFAULT_WORLD_SCALE = 2048;
const DEFAULT_WARP_STRENGTH = 180;
const DEFAULT_ELEV_FREQUENCY = 0.0025;
const DEFAULT_MOISTURE_FREQUENCY = 0.0035;
const DEFAULT_TEMPERATURE_FREQUENCY = 0.002;
const DEFAULT_PERSISTENCE = 0.5;

interface RGB {
    r: number;
    g: number;
    b: number;
}

export interface TerrainPalette {
    SEA: string;
    SHOAL: string;
    FOREST: string;
    SWAMP: string;
    PLAINS: string;
    MOUNTAIN: string;
    SNOW: string;
}

export interface TerrainLighting {
    azimuth: number;
    elevation: number;
    intensity: number;
}

export interface TerrainContour {
    enabled: boolean;
    step: number;
    strength: number;
}

export interface TerrainOctaves {
    elevation: number;
    moisture: number;
    temperature: number;
    shading: number;
}

interface TerrainCoreOptions {
    width: number;
    height: number;
    seed: string;
    pixelScale: number;
    worldScale: number;
    warpStrength: number;
    elevationFrequency: number;
    moistureFrequency: number;
    temperatureFrequency: number;
    persistence: number;
    seaLevel: number;
    snowLevel: number;
    palette: TerrainPalette;
    lighting: TerrainLighting;
    contour: TerrainContour;
    octaves: TerrainOctaves;
}

export interface TerrainOverlayContext {
    width: number;
    height: number;
    pixelScale: number;
    options: TerrainCoreOptions;
}

export interface TerrainOverlayDefinition {
    id: string;
    paint: (_ctx: CanvasRenderingContext2D, _context: TerrainOverlayContext) => void;
    hash?: string;
    opacity?: number;
    blendMode?: string; // Pixi v8 uses string literals like 'normal', 'add', 'multiply'
    zIndex?: number;
}

interface ResolvedTerrainOptions extends TerrainCoreOptions {
    overlays: TerrainOverlayDefinition[];
}

export interface TerrainOptionsOverrides {
    width?: number;
    height?: number;
    seed?: string;
    pixelScale?: number;
    worldScale?: number;
    warpStrength?: number;
    elevationFrequency?: number;
    moistureFrequency?: number;
    temperatureFrequency?: number;
    persistence?: number;
    seaLevel?: number;
    snowLevel?: number;
    palette?: Partial<TerrainPalette>;
    lighting?: Partial<TerrainLighting>;
    contour?: Partial<TerrainContour>;
    octaves?: Partial<TerrainOctaves>;
    overlays?: TerrainOverlayDefinition[];
    forceRegenerate?: boolean;
}

interface TerrainRenderState {
    worldLayer?: Container;             // NEW: parent container for dimetric transform
    terrainLayer?: Container;
    overlayLayer?: Container;
    __terrainCanvas?: HTMLCanvasElement;
    __terrainSprite?: Sprite;
    __lastTerrainHash?: string;
    __overlaySprites?: Map<string, Sprite>;
    __overlayHashes?: Map<string, string>;
    __dimetric?: DimetricParams;        // NEW: dimetric projection params
    __riverGen?: RiverGenerator;        // NEW: store river generator for overlays
}

type TerrainApplication = Application & TerrainRenderState;

const DEFAULT_PALETTE: TerrainPalette = {
    SEA: '#1b3b73',
    SHOAL: '#2d6aa5',
    FOREST: '#3a6f3f',
    SWAMP: '#55663a',
    PLAINS: '#b7c178',
    MOUNTAIN: '#4a4a48',  // Very dark gray - almost charcoal for high contrast
    SNOW: '#f3f7fb'
};

const DEFAULT_LIGHTING: TerrainLighting = {
    azimuth: 0.125,
    elevation: 0.38,
    intensity: 1.0
};

const DEFAULT_CONTOUR: TerrainContour = {
    enabled: true,
    step: 0.075,
    strength: 0.32
};

const DEFAULT_OCTAVES: TerrainOctaves = {
    elevation: 7,
    moisture: 5,
    temperature: 3,
    shading: 5
};

export function pickPixelScale(width: number, height: number): number {
    const area = width * height;
    if (area <= 1_000_000) return 1;
    if (area <= 2_300_000) return 2;
    if (area <= 4_000_000) return 3;
    return 4;
}

function resolveOptions(app: TerrainApplication, overrides: TerrainOptionsOverrides = {}): {
    options: ResolvedTerrainOptions;
    force: boolean;
} {
    const rendererWidth = Math.floor((app.renderer as any)?.width ?? app.canvas?.width ?? DEFAULT_WIDTH);
    const rendererHeight = Math.floor((app.renderer as any)?.height ?? app.canvas?.height ?? DEFAULT_HEIGHT);

    const width = Math.max(1, Math.floor(overrides.width ?? rendererWidth ?? DEFAULT_WIDTH));
    const height = Math.max(1, Math.floor(overrides.height ?? rendererHeight ?? DEFAULT_HEIGHT));

    const requestedPixelScale = overrides.pixelScale;
    const autoScale = pickPixelScale(width, height);
    const pixelScale = Math.max(1, Math.floor(requestedPixelScale ?? autoScale));

    const area = width * height;
    const highRes = pixelScale >= 3 || area > 2_300_000;
    const veryHigh = area >= 4_000_000;

    const palette: TerrainPalette = {
        ...DEFAULT_PALETTE,
        ...overrides.palette
    };

    const lighting: TerrainLighting = {
        ...DEFAULT_LIGHTING,
        ...overrides.lighting
    };

    const contour: TerrainContour = {
        ...DEFAULT_CONTOUR,
        ...overrides.contour
    };

    const octaves: TerrainOctaves = {
        elevation: overrides.octaves?.elevation ?? (highRes ? 5 : DEFAULT_OCTAVES.elevation),
        moisture: overrides.octaves?.moisture ?? (highRes ? 4 : DEFAULT_OCTAVES.moisture),
        temperature: overrides.octaves?.temperature ?? (veryHigh ? 2 : DEFAULT_OCTAVES.temperature),
        shading: overrides.octaves?.shading ?? (highRes ? 4 : DEFAULT_OCTAVES.shading)
    };

    const options: ResolvedTerrainOptions = {
        width,
        height,
        seed: overrides.seed ?? DEFAULT_SEED,
        pixelScale,
        worldScale: overrides.worldScale ?? DEFAULT_WORLD_SCALE,
        warpStrength: overrides.warpStrength ?? DEFAULT_WARP_STRENGTH,
        elevationFrequency: overrides.elevationFrequency ?? DEFAULT_ELEV_FREQUENCY,
        moistureFrequency: overrides.moistureFrequency ?? DEFAULT_MOISTURE_FREQUENCY,
        temperatureFrequency: overrides.temperatureFrequency ?? DEFAULT_TEMPERATURE_FREQUENCY,
        persistence: overrides.persistence ?? DEFAULT_PERSISTENCE,
        seaLevel: overrides.seaLevel ?? -0.2,  // Matched to terrainGenerator.ts
        snowLevel: overrides.snowLevel ?? 0.25, // Lowered to 0.25 - snow appears on upper half of mountains
        palette,
        lighting,
        contour,
        octaves,
        overlays: overrides.overlays ?? []
    };

    return {
        options,
        force: Boolean(overrides.forceRegenerate)
    };
}

function ensureRenderLayers(app: TerrainApplication): void {
    if (!app.worldLayer) {
        const worldLayer = new Container();
        worldLayer.sortableChildren = false;
        app.stage.addChild(worldLayer);
        app.worldLayer = worldLayer;

        // default dimetric
        app.__dimetric = app.__dimetric ?? DIMETRIC_DEFAULT;
        applyDimetric(worldLayer, app.__dimetric);
    }

    if (!app.terrainLayer) {
        const terrainLayer = new Container();
        terrainLayer.sortableChildren = false;
        app.worldLayer!.addChild(terrainLayer);
        app.terrainLayer = terrainLayer;
    }

    if (!app.overlayLayer) {
        const overlayLayer = new Container();
        overlayLayer.sortableChildren = true;
        app.worldLayer!.addChild(overlayLayer);
        app.overlayLayer = overlayLayer;
    }

    if (!app.__overlaySprites) {
        app.__overlaySprites = new Map();
    }

    if (!app.__overlayHashes) {
        app.__overlayHashes = new Map();
    }
}

function createConfigHash(options: ResolvedTerrainOptions): string {
    const hashSource = JSON.stringify({
        width: options.width,
        height: options.height,
        pixelScale: options.pixelScale,
        seed: options.seed,
        worldScale: options.worldScale,
        warpStrength: options.warpStrength,
        elevationFrequency: options.elevationFrequency,
        moistureFrequency: options.moistureFrequency,
        temperatureFrequency: options.temperatureFrequency,
        persistence: options.persistence,
        seaLevel: options.seaLevel,
        snowLevel: options.snowLevel,
        palette: options.palette,
        lighting: options.lighting,
        contour: options.contour,
        octaves: options.octaves
    });

    let hash = 2166136261;
    for (let i = 0; i < hashSource.length; i++) {
        hash ^= hashSource.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16);
}

function hexToRgb(hex: string): RGB {
    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
    const value = normalized.length === 3
        ? normalized.split('').map(c => c + c).join('')
        : normalized;
    const int = parseInt(value, 16);
    return {
        r: (int >> 16) & 0xff,
        g: (int >> 8) & 0xff,
        b: int & 0xff
    };
}

function clamp01(value: number): number {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

function clamp255(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

function mixRGB(a: RGB, b: RGB, t: number): RGB {
    return {
        r: Math.round(lerp(a.r, b.r, t)),
        g: Math.round(lerp(a.g, b.g, t)),
        b: Math.round(lerp(a.b, b.b, t))
    };
}

function fbm2(noise: ValueNoise2D, x: number, y: number, octaves: number, lacunarity: number, persistence: number): number {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
        total += noise.noise(x * frequency, y * frequency) * amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return maxAmplitude === 0 ? 0 : total / maxAmplitude;
}

function sampleElev(noise: ValueNoise2D, x: number, y: number, frequency: number, octaves: number, persistence: number): number {
    return fbm2(noise, x * frequency, y * frequency, octaves, 2, persistence);
}

function generateTerrainPixels(
    options: ResolvedTerrainOptions,
    elevationNoise: ValueNoise2D,
    moistureNoise: ValueNoise2D,
    temperatureNoise: ValueNoise2D,
    domainWarp: DomainWarp
): Uint8ClampedArray {
    const { width, height, pixelScale, warpStrength, worldScale, octaves, persistence } = options;
    const data = new Uint8ClampedArray(width * height * 4);

    // Generate rivers using proper downhill flow algorithm
    const riverGen = new RiverGenerator();

    // Create elevation sampler function for river generation
    const sampleElevationAt = (px: number, py: number): number => {
        const nx = (px / width - 0.5) * worldScale;
        const ny = (py / height - 0.5) * worldScale;
        const warped = domainWarp.warp(nx, ny, warpStrength);
        let elev = sampleElev(
            elevationNoise,
            warped.x,
            warped.y,
            options.elevationFrequency,
            octaves.elevation,
            persistence
        );
        // Apply same elevation boost as rendering
        elev = elev * 1.5 + (elev > 0 ? elev * 0.5 : 0);
        return elev;
    };

    // Generate rivers - use seed as number
    const seedNum = options.seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    riverGen.generateRivers(width, height, sampleElevationAt, seedNum, 100); // Increased to 100 for better coverage
    console.log(`🌊 Generated ${riverGen.getRivers().length} rivers for terrain`);

    // Return riverGen along with pixel data so it can be used for overlays
    (options as any).__riverGen = riverGen;

    const cSea = hexToRgb(options.palette.SEA);
    const cShoal = hexToRgb(options.palette.SHOAL);
    const cForest = hexToRgb(options.palette.FOREST);
    const cSwamp = hexToRgb(options.palette.SWAMP);
    const cPlains = hexToRgb(options.palette.PLAINS);
    const cMount = hexToRgb(options.palette.MOUNTAIN);
    const cSnow = hexToRgb(options.palette.SNOW);

    let maxElev = -999;
    let minElev = 999;
    let elevSamples = 0;

    for (let y = 0; y < height; y += pixelScale) {
        for (let x = 0; x < width; x += pixelScale) {
            const sampleX = x + pixelScale * 0.5;
            const sampleY = y + pixelScale * 0.5;

            const nx = (sampleX / width - 0.5) * worldScale;
            const ny = (sampleY / height - 0.5) * worldScale;

            const warped = domainWarp.warp(nx, ny, warpStrength);
            const dwx = warped.x;
            const dwy = warped.y;

            let elev = sampleElev(
                elevationNoise,
                dwx,
                dwy,
                options.elevationFrequency,
                octaves.elevation,
                persistence
            );

            // BOOST elevation to create taller mountains (multiply by 1.5 and add 0.2 to peaks)
            elev = elev * 1.5 + (elev > 0 ? elev * 0.5 : 0); // Amplify positive elevations more

            // Use eroded elevation if this pixel was carved by a river
            elev = riverGen.getElevation(Math.floor(sampleX), Math.floor(sampleY), sampleElevationAt);

            const moist = sampleElev(
                moistureNoise,
                dwx,
                dwy,
                options.moistureFrequency,
                octaves.moisture,
                persistence
            );

            let temp = sampleElev(
                temperatureNoise,
                dwx,
                dwy,
                options.temperatureFrequency,
                octaves.temperature,
                0.45
            );

            const lat = Math.abs((sampleY / height) - 0.5) * 2;
            temp -= lat * 0.35;

            const oceanW = smoothstep((options.seaLevel - 0.11) - 0.03, options.seaLevel + 0.02, elev);
            const shoreBand = clamp01((elev - (options.seaLevel - 0.02)) / 0.06);

            // AGGRESSIVE mountain visibility - mountains start at elevation 0.15 (just above sea level)
            const forestW = clamp01((moist + 0.15) * (0.9 - Math.abs(temp) * 0.9)) * clamp01(1 - elev * 1.5); // Heavy reduction at elevation

            // Boost swamps near rivers for marsh effect
            const nearRiver = riverGen.isRiver(x, y) || riverGen.isRiver(x + 1, y) || riverGen.isRiver(x, y + 1);
            const swampBoost = nearRiver ? 0.15 : 0.0;
            const swampW = clamp01(moist * 0.9 + swampBoost - elev * 0.5) * clamp01(1 - elev * 2); // Swamps only at low elevation

            const plainsW = clamp01(1 - forestW - swampW) * clamp01(elev + 0.6) * clamp01(1 - elev * 2); // Plains fade fast

            // MOUNTAINS: Start at 0.15, become dominant by 0.3
            const mountW = Math.max(0, (elev - 0.15) * 4.0); // 4x multiplier for strong mountain presence

            // SNOW: Much more aggressive - snow DOMINATES above threshold (10x multiplier)
            const snowW = Math.max(0, (elev - options.snowLevel) * 10); // 10x multiplier for pure white peaks

            let color: RGB;

            if (elev < options.seaLevel) {
                color = mixRGB(cSea, cShoal, clamp01(shoreBand + oceanW * 0.2));
            } else {
                const wSum = forestW + swampW + plainsW + mountW + snowW + 1e-6;
                const wf = forestW / wSum;
                const ws = swampW / wSum;
                const wp = plainsW / wSum;
                const wm = mountW / wSum;
                const wn = snowW / wSum;

                color = {
                    r: Math.round(cForest.r * wf + cSwamp.r * ws + cPlains.r * wp + cMount.r * wm + cSnow.r * wn),
                    g: Math.round(cForest.g * wf + cSwamp.g * ws + cPlains.g * wp + cMount.g * wm + cSnow.g * wn),
                    b: Math.round(cForest.b * wf + cSwamp.b * ws + cPlains.b * wp + cMount.b * wm + cSnow.b * wn)
                };
            }

            const epx = sampleElev(elevationNoise, dwx + 0.5, dwy, options.elevationFrequency, octaves.shading, persistence)
                - sampleElev(elevationNoise, dwx - 0.5, dwy, options.elevationFrequency, octaves.shading, persistence);
            const epy = sampleElev(elevationNoise, dwx, dwy + 0.5, options.elevationFrequency, octaves.shading, persistence)
                - sampleElev(elevationNoise, dwx, dwy - 0.5, options.elevationFrequency, octaves.shading, persistence);

            const nxShade = -epx * 2;
            const nyShade = -epy * 2;
            const nzShade = 1;
            const len = Math.max(0.0001, Math.hypot(nxShade, nyShade, nzShade));

            const light = {
                x: Math.cos(options.lighting.azimuth * Math.PI * 2) * Math.cos(options.lighting.elevation * Math.PI / 2),
                y: Math.sin(options.lighting.azimuth * Math.PI * 2) * Math.cos(options.lighting.elevation * Math.PI / 2),
                z: Math.sin(options.lighting.elevation * Math.PI / 2)
            };

            const ndotl = clamp01((nxShade / len) * light.x + (nyShade / len) * light.y + (nzShade / len) * light.z);
            const shade = lerp(0.65, 1.25, ndotl * options.lighting.intensity);

            color = {
                r: clamp255(color.r * shade),
                g: clamp255(color.g * shade),
                b: clamp255(color.b * shade)
            };

            // RIVERS: Check if this pixel is part of a generated river path
            // Rivers are generated using proper downhill flow algorithm
            if (riverGen.isRiver(x, y)) {
                // Blend river color (blue-cyan) with terrain
                const riverBlue = { r: 80, g: 160, b: 220 }; // Darker blue for visibility
                const riverBlend = 0.8; // Strong blue color

                color = {
                    r: Math.round(lerp(color.r, riverBlue.r, riverBlend)),
                    g: Math.round(lerp(color.g, riverBlue.g, riverBlend)),
                    b: Math.round(lerp(color.b, riverBlue.b, riverBlend))
                };
            }

            if (options.contour.enabled && elev >= options.seaLevel) {
                const bands = (elev - options.seaLevel) / Math.max(1e-6, (1 - options.seaLevel));
                const band = (bands / options.contour.step) % 1;
                if (band < 0.06) {
                    const t = 1 - (band / 0.06);
                    const attenuation = 1 - options.contour.strength * t;
                    color = {
                        r: clamp255(color.r * attenuation),
                        g: clamp255(color.g * attenuation),
                        b: clamp255(color.b * attenuation)
                    };
                }
            }

            for (let oy = 0; oy < pixelScale; oy++) {
                const Y = y + oy;
                if (Y >= height) continue;
                for (let ox = 0; ox < pixelScale; ox++) {
                    const X = x + ox;
                    if (X >= width) continue;

                    const idx = (Y * width + X) * 4;
                    data[idx] = color.r;
                    data[idx + 1] = color.g;
                    data[idx + 2] = color.b;
                    data[idx + 3] = 255;
                }
            }

            // Track elevation stats
            maxElev = Math.max(maxElev, elev);
            minElev = Math.min(minElev, elev);
            elevSamples++;
        }
    }

    // Log elevation range for debugging
    console.log(`🏔️ Terrain elevation range: ${minElev.toFixed(3)} to ${maxElev.toFixed(3)} (${elevSamples} samples)`);
    console.log(`📊 Mountain threshold: 0.15, Snow threshold: ${options.snowLevel}`);

    return data;
}

function updateOverlays(app: TerrainApplication, options: ResolvedTerrainOptions, baseHash: string): void {
    if (!options.overlays.length) {
        if (app.overlayLayer) {
            app.overlayLayer.removeChildren().forEach(child => child.destroy({ texture: true })); // Pixi v8: no baseTexture option
        }
        app.__overlaySprites?.clear();
        app.__overlayHashes?.clear();
        return;
    }

    const overlaySprites = app.__overlaySprites!;
    const overlayHashes = app.__overlayHashes!;
    const activeIds = new Set<string>();

    const context: TerrainOverlayContext = {
        width: options.width,
        height: options.height,
        pixelScale: options.pixelScale,
        options
    };

    for (const overlay of options.overlays) {
        const id = overlay.id;
        activeIds.add(id);

        const overlayKey = `${baseHash}:${id}:${overlay.hash ?? ''}`;
        const cachedHash = overlayHashes.get(id);
        let sprite = overlaySprites.get(id);

        if (sprite && cachedHash === overlayKey) {
            if (!sprite.parent) {
                app.overlayLayer!.addChild(sprite);
            }
            continue;
        }

        if (sprite) {
            sprite.destroy({ texture: true }); // Pixi v8: no baseTexture option
        }

        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            continue;
        }

        overlay.paint(ctx, context);

        const texture = Texture.from(canvas);
        texture.source.scaleMode = 'linear'; // Pixi v8: texture.source instead of baseTexture
        sprite = new Sprite(texture);
        sprite.alpha = overlay.opacity ?? 1;
        sprite.blendMode = (overlay.blendMode ?? 'normal') as any; // Pixi v8: string literal, cast for compatibility
        sprite.zIndex = overlay.zIndex ?? 0;

        app.overlayLayer!.addChild(sprite);
        overlaySprites.set(id, sprite);
        overlayHashes.set(id, overlayKey);
    }

    // Remove overlays that are no longer active
    for (const [id, sprite] of Array.from(overlaySprites.entries())) { // Convert to array for iteration
        if (!activeIds.has(id)) {
            if (sprite.parent) {
                sprite.parent.removeChild(sprite);
            }
            sprite.destroy({ texture: true }); // Pixi v8: no baseTexture option
            overlaySprites.delete(id);
            overlayHashes.delete(id);
        }
    }

    app.overlayLayer?.children.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

export function generateTerrain(app: Application, overrides: TerrainOptionsOverrides = {}): Sprite {
    const terrainApp = app as TerrainApplication;
    ensureRenderLayers(terrainApp);

    const { options, force } = resolveOptions(terrainApp, overrides);
    const configHash = createConfigHash(options);

    if (!force && terrainApp.__terrainSprite && terrainApp.__lastTerrainHash === configHash) {
        updateOverlays(terrainApp, options, configHash);
        return terrainApp.__terrainSprite;
    }

    const elevationNoise = new ValueNoise2D(`${options.seed}:elev`);
    const moistureNoise = new ValueNoise2D(`${options.seed}:moist`);
    const temperatureNoise = new ValueNoise2D(`${options.seed}:temp`);
    const domainWarp = new DomainWarp(`${options.seed}:warp`);

    const pixels = generateTerrainPixels(options, elevationNoise, moistureNoise, temperatureNoise, domainWarp);

    let canvas = terrainApp.__terrainCanvas;
    if (!canvas) {
        canvas = document.createElement('canvas');
        terrainApp.__terrainCanvas = canvas;
    }

    canvas.width = options.width;
    canvas.height = options.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Unable to acquire 2D context for terrain canvas');
    }

    const imageData = new ImageData(new Uint8ClampedArray(pixels) as any, options.width, options.height);
    ctx.putImageData(imageData, 0, 0);

    const texture = Texture.from(canvas);
    texture.source.scaleMode = 'linear'; // Pixi v8: texture.source instead of baseTexture
    // Note: Pixi v8 handles mipmaps automatically for appropriate textures

    if (terrainApp.__terrainSprite) {
        terrainApp.terrainLayer?.removeChild(terrainApp.__terrainSprite);
        terrainApp.__terrainSprite.destroy({ texture: true }); // Pixi v8: no baseTexture option
    }

    const sprite = new Sprite(texture);
    sprite.anchor.set(0);
    sprite.x = 0;
    sprite.y = 0;

    terrainApp.terrainLayer?.removeChildren();
    terrainApp.terrainLayer?.addChild(sprite);

    terrainApp.__terrainSprite = sprite;
    terrainApp.__lastTerrainHash = configHash;

    // Add automatic river overlay if riverGen was created during terrain generation
    const riverGen = (options as any).__riverGen as RiverGenerator | undefined;
    if (riverGen) {
        terrainApp.__riverGen = riverGen;

        // Calculate adaptive river width based on map size
        const maxWidth = Math.max(5, Math.floor(Math.min(options.width, options.height) / 180));
        const autoRiverOverlay = makeRiversOverlay('rivers', riverGen, {
            minWidth: 2,
            maxWidth: maxWidth,
            foamSlope: 0.9,
            alpha: 0.9
        });

        // If the caller didn't supply a rivers overlay, append ours
        const hasRivers = options.overlays?.some(o => o.id === 'rivers');
        if (!hasRivers) {
            options.overlays = [...options.overlays, autoRiverOverlay];
        }
    }

    updateOverlays(terrainApp, options, configHash);

    return sprite;
}

export function setSeedAndRegenerate(app: Application, seed: string, overrides: TerrainOptionsOverrides = {}): Sprite {
    return generateTerrain(app, { ...overrides, seed, forceRegenerate: true });
}

export function exportPNG(app: Application, name = 'terrain.png'): void {
    const terrainApp = app as TerrainApplication;
    if (!terrainApp.__terrainCanvas) {
        throw new Error('Terrain has not been generated yet');
    }

    const link = document.createElement('a');
    link.download = name;
    link.href = terrainApp.__terrainCanvas.toDataURL('image/png');
    link.click();
}

export function makeOverlaySprite(width: number, height: number, paintFn2D: (_ctx: CanvasRenderingContext2D) => void): Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Unable to acquire 2D context for overlay sprite');
    }

    paintFn2D(ctx);

    const texture = Texture.from(canvas);
    texture.source.scaleMode = 'linear'; // Pixi v8: texture.source instead of baseTexture
    return new Sprite(texture);
}

/** Set or update the dimetric projection parameters for the terrain view */
export function setDimetric(app: Application, p: DimetricParams): void {
    const terrainApp = app as TerrainApplication;
    ensureRenderLayers(terrainApp);
    terrainApp.__dimetric = p;
    applyDimetric(terrainApp.worldLayer!, p);
}
