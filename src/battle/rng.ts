/**
 * Canvas 14 - Deterministic RNG
 * 
 * Per-stream seeded random number generation for battle consistency
 */

// ============================================================================
// SEEDED RNG (Linear Congruential Generator)
// ============================================================================

/**
 * LCG parameters (from Numerical Recipes)
 */
const LCG_A = 1664525;
const LCG_C = 1013904223;
const LCG_M = 2 ** 32;

/**
 * Seeded random number generator
 */
export class SeededRNG {
  private state: number;
  private readonly initialSeed: number;
  
  constructor(seed: number | string) {
    this.initialSeed = typeof seed === 'string' ? hashString(seed) : seed;
    this.state = this.initialSeed;
  }
  
  /**
   * Get next random number in [0, 1)
   */
  next(): number {
    this.state = (LCG_A * this.state + LCG_C) % LCG_M;
    return this.state / LCG_M;
  }
  
  /**
   * Get random integer in [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Get random float in [min, max]
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Roll d20
   */
  d20(): number {
    return this.nextInt(1, 20);
  }
  
  /**
   * Roll d100 (percentage)
   */
  d100(): number {
    return this.nextInt(1, 100);
  }
  
  /**
   * Check if percentage succeeds
   */
  check(chance: number): boolean {
    return this.next() * 100 < chance;
  }
  
  /**
   * Shuffle array in place
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
  
  /**
   * Reset to initial seed
   */
  reset(): void {
    this.state = this.initialSeed;
  }
  
  /**
   * Get current state for checksum
   */
  getState(): number {
    return this.state;
  }
}

// ============================================================================
// BATTLE RNG MANAGER
// ============================================================================

/**
 * RNG stream types for battle
 */
export type RNGStream = 
  | 'move'      // Movement divert rolls, ZOC triggers
  | 'hit'       // Hit chance rolls
  | 'crit'      // Critical hit rolls
  | 'damage'    // Damage variance rolls
  | 'status'    // Status effect application rolls
  | 'morale'    // Morale/rout checks
  | 'init';     // Initiative tie-breaks

/**
 * Battle RNG manager with separate streams
 */
export class BattleRNG {
  private streams: Map<RNGStream, SeededRNG>;
  private readonly baseSeed: string;
  private round: number;
  
  constructor(payloadId: string, round: number = 0) {
    this.baseSeed = payloadId;
    this.round = round;
    this.streams = new Map();
    
    // Initialize all streams
    this.initializeStreams();
  }
  
  /**
   * Initialize all RNG streams with unique seeds
   */
  private initializeStreams(): void {
    const streamTypes: RNGStream[] = [
      'move', 'hit', 'crit', 'damage', 'status', 'morale', 'init'
    ];
    
    for (const stream of streamTypes) {
      const seed = this.generateStreamSeed(stream);
      this.streams.set(stream, new SeededRNG(seed));
    }
  }
  
  /**
   * Generate deterministic seed for stream
   */
  private generateStreamSeed(stream: RNGStream): string {
    return `${this.baseSeed}|r${this.round}|${stream}`;
  }
  
  /**
   * Get RNG for specific stream
   */
  getStream(stream: RNGStream): SeededRNG {
    const rng = this.streams.get(stream);
    if (!rng) {
      throw new Error(`RNG stream ${stream} not initialized`);
    }
    return rng;
  }
  
  /**
   * Advance to next round
   */
  nextRound(): void {
    this.round++;
    this.initializeStreams(); // Reset all streams for new round
  }
  
  /**
   * Get current round number
   */
  getRound(): number {
    return this.round;
  }
  
  /**
   * Get checksum of all stream states
   */
  getChecksum(): string {
    const states: number[] = [];
    const streamTypes: RNGStream[] = [
      'move', 'hit', 'crit', 'damage', 'status', 'morale', 'init'
    ];
    
    for (const stream of streamTypes) {
      const rng = this.streams.get(stream);
      if (rng) {
        states.push(rng.getState());
      }
    }
    
    return hashString(states.join('|')).toString(36);
  }
  
  /**
   * Clone for speculative execution
   */
  clone(): BattleRNG {
    const clone = new BattleRNG(this.baseSeed, this.round);
    
    // Copy stream states
    const streamEntries = Array.from(this.streams.entries());
    for (const [streamType, rng] of streamEntries) {
      const clonedRng = clone.streams.get(streamType);
      if (clonedRng) {
        // Copy state by consuming same number of values
        // This is a simple approach; real implementation might serialize state
        const originalState = rng.getState();
        while (clonedRng.getState() !== originalState && clonedRng.getState() < originalState) {
          clonedRng.next();
        }
      }
    }
    
    return clone;
  }
}

// ============================================================================
// UNIT-SPECIFIC RNG
// ============================================================================

/**
 * Get unit-specific RNG for deterministic per-unit rolls
 */
export function getUnitRNG(
  _battleRNG: BattleRNG,
  stream: RNGStream,
  unitId: string
): SeededRNG {
  const round = _battleRNG.getRound();
  
  // Create unit-specific seed
  const seed = `${round}|${stream}|${unitId}`;
  return new SeededRNG(hashString(seed));
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate deterministic seed from components
 */
export function generateBattleSeed(
  payloadId: string,
  round: number,
  phase: string
): string {
  return `${payloadId}|r${round}|${phase}`;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Roll d20 with advantage (take higher of 2 rolls)
 */
export function rollAdvantage(rng: SeededRNG): number {
  const roll1 = rng.d20();
  const roll2 = rng.d20();
  return Math.max(roll1, roll2);
}

/**
 * Roll d20 with disadvantage (take lower of 2 rolls)
 */
export function rollDisadvantage(rng: SeededRNG): number {
  const roll1 = rng.d20();
  const roll2 = rng.d20();
  return Math.min(roll1, roll2);
}

/**
 * Weighted random selection
 */
export function weightedRandom<T>(
  rng: SeededRNG,
  items: T[],
  weights: number[]
): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights must have same length');
  }
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = rng.nextFloat(0, totalWeight);
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

/**
 * Gaussian random (Box-Muller transform)
 */
export function gaussianRandom(rng: SeededRNG, mean: number, stdDev: number): number {
  const u1 = rng.next();
  const u2 = rng.next();
  
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}
