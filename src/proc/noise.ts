/**
 * Deterministic Noise System for World Generation
 * 
 * Features:
 * - Seeded value noise with deterministic results
 * - Fractal Brownian Motion (fBm) for complex terrain
 * - Domain warping for continental shapes
 * - No external dependencies
 */

export class SeededRandom {
  private seed: number;
  
  constructor(seed: string | number) {
    this.seed = typeof seed === 'string' ? this.hash(seed) : seed;
  }
  
  private hash(str: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  
  next(): number {
    let x = this.seed + 0x9e3779b9;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return (this.seed >>> 0) / 0x100000000;
  }
  
  nextFloat(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min);
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max + 1));
  }
}

/**
 * 2D Value Noise Generator
 * Deterministic noise based on grid coordinates
 */
export class ValueNoise2D {
  private permTable: number[];
  private gradients: { x: number; y: number }[];
  
  constructor(seed: string | number) {
    const rng = new SeededRandom(seed);
    
    // Generate permutation table
    this.permTable = Array.from({ length: 512 }, (_, i) => i % 256);
    
    // Shuffle using seeded random
    for (let i = this.permTable.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i);
      [this.permTable[i], this.permTable[j]] = [this.permTable[j], this.permTable[i]];
    }
    
    // Duplicate for wrapping
    for (let i = 0; i < 256; i++) {
      this.permTable[256 + i] = this.permTable[i];
    }
    
    // Generate gradient vectors
    this.gradients = [];
    for (let i = 0; i < 256; i++) {
      const angle = rng.nextFloat(0, Math.PI * 2);
      this.gradients.push({
        x: Math.cos(angle),
        y: Math.sin(angle)
      });
    }
  }
  
  private fade(t: number): number {
    // Smootherstep: 6t^5 - 15t^4 + 10t^3
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  private grad(hash: number, x: number, y: number): number {
    const g = this.gradients[hash & 255];
    return g.x * x + g.y * y;
  }
  
  /**
   * Get noise value at (x, y)
   * Returns value in range [-1, 1]
   */
  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.permTable[X] + Y;
    const B = this.permTable[X + 1] + Y;
    
    return this.lerp(
      this.lerp(
        this.grad(this.permTable[A], x, y),
        this.grad(this.permTable[B], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.permTable[A + 1], x, y - 1),
        this.grad(this.permTable[B + 1], x - 1, y - 1),
        u
      ),
      v
    );
  }
  
  /**
   * Fractal Brownian Motion - layered noise for complex terrain
   */
  fbm(x: number, y: number, octaves: number = 6, persistence: number = 0.5, lacunarity: number = 2.0): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return value / maxValue;
  }
  
  /**
   * Ridge noise - good for mountain ridges
   */
  ridge(x: number, y: number, octaves: number = 6, persistence: number = 0.5, lacunarity: number = 2.0): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      const n = Math.abs(this.noise(x * frequency, y * frequency));
      value += (1 - n) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return value / maxValue;
  }
}

/**
 * Domain Warping for Continental Shapes
 * Distorts coordinate space to create more organic landmasses
 */
export class DomainWarp {
  private noiseX: ValueNoise2D;
  private noiseY: ValueNoise2D;
  
  constructor(seed: string | number) {
    this.noiseX = new ValueNoise2D(`${seed}_warpX`);
    this.noiseY = new ValueNoise2D(`${seed}_warpY`);
  }
  
  /**
   * Apply domain warp to coordinates
   * Returns warped {x, y} coordinates
   */
  warp(x: number, y: number, strength: number = 100): { x: number; y: number } {
    const warpX = this.noiseX.fbm(x * 0.01, y * 0.01, 4) * strength;
    const warpY = this.noiseY.fbm(x * 0.01, y * 0.01, 4) * strength;
    
    return {
      x: x + warpX,
      y: y + warpY
    };
  }
}

/**
 * World Generation Noise Coordinator
 * Combines multiple noise layers for believable terrain
 */
export class WorldNoise {
  public elevation: ValueNoise2D;
  public temperature: ValueNoise2D;
  public moisture: ValueNoise2D;
  public warp: DomainWarp;
  
  constructor(public seed: string) {
    this.elevation = new ValueNoise2D(`${seed}_elev`);
    this.temperature = new ValueNoise2D(`${seed}_temp`);
    this.moisture = new ValueNoise2D(`${seed}_moist`);
    this.warp = new DomainWarp(`${seed}_warp`);
  }
  
  /**
   * Generate elevation with continental warping
   */
  getElevation(x: number, y: number, continentFreq: number = 1/1024, warpStrength: number = 700): number {
    const warped = this.warp.warp(x, y, warpStrength);
    return this.elevation.fbm(warped.x * continentFreq, warped.y * continentFreq, 6, 0.6, 2.0);
  }
  
  /**
   * Generate temperature based on latitude and elevation
   */
  getTemperature(x: number, y: number, elevation: number, mapHeight: number): number {
    const latitude = Math.abs(y - mapHeight / 2) / (mapHeight / 2); // 0 at equator, 1 at poles
    const baseTemp = 1 - latitude; // Hot at equator, cold at poles
    const altitudeCooling = Math.max(0, elevation - 0.3) * 0.8; // High elevation is cooler
    const noise = this.temperature.fbm(x * 0.005, y * 0.005, 3, 0.3, 2.0) * 0.2;
    
    return Math.max(0, Math.min(1, baseTemp - altitudeCooling + noise));
  }
  
  /**
   * Generate moisture with windward/leeward effects
   */
  getMoisture(x: number, y: number, elevation: number): number {
    const baseMoisture = this.moisture.fbm(x * 0.003, y * 0.003, 4, 0.5, 2.0);
    
    // Simplified windward effect (higher moisture on west-facing slopes)
    const windwardBonus = elevation > 0.4 ? 
      Math.max(0, this.elevation.noise(x * 0.01, y * 0.01)) * 0.3 : 0;
    
    return Math.max(0, Math.min(1, (baseMoisture + 1) / 2 + windwardBonus));
  }
}

/**
 * Utility functions for noise-based generation
 */
export class NoiseUtils {
  /**
   * Clamp value to range
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Smooth step interpolation
   */
  static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = NoiseUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  
  /**
   * Linear interpolation
   */
  static lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  /**
   * Remap value from one range to another
   */
  static remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
  }
}