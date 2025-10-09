import { SeededRandom } from "../../proc/noise";

export interface RandomSource {
  next(): number;
  nextFloat(min?: number, max?: number): number;
  nextInt(min: number, max: number): number;
  pick<T>(values: readonly T[]): T;
}

class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random();
  }

  nextFloat(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    if (max < min) {
      throw new Error("RandomSource.nextInt requires max >= min");
    }
    return Math.floor(this.nextFloat(min, max + 1));
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new Error("Cannot pick from an empty collection");
    }
    const index = this.nextInt(0, values.length - 1);
    return values[index];
  }
}

export class SeededRandomSource implements RandomSource {
  private readonly seeded: SeededRandom;

  constructor(seed: string | number) {
    this.seeded = new SeededRandom(seed);
  }

  next(): number {
    return this.seeded.next();
  }

  nextFloat(min: number = 0, max: number = 1): number {
    return min + this.seeded.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    if (max < min) {
      throw new Error("RandomSource.nextInt requires max >= min");
    }
    return Math.floor(this.nextFloat(min, max + 1));
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new Error("Cannot pick from an empty collection");
    }
    const index = this.nextInt(0, values.length - 1);
    return values[index];
  }
}

const defaultSource = new MathRandomSource();
let currentSource: RandomSource = defaultSource;

export const rng = {
  next(): number {
    return currentSource.next();
  },
  float(min: number = 0, max: number = 1): number {
    return currentSource.nextFloat(min, max);
  },
  int(min: number, max: number): number {
    return currentSource.nextInt(min, max);
  },
  pick<T>(values: readonly T[]): T {
    return currentSource.pick(values);
  },
  bool(probability: number = 0.5): boolean {
    if (probability <= 0) return false;
    if (probability >= 1) return true;
    return currentSource.next() < probability;
  },
  id(prefix: string = "rand"): string {
    const segment = currentSource.next().toString(36).slice(2, 10);
    const timestamp = Date.now().toString(36);
    return `${prefix}_${timestamp}_${segment}`;
  }
};

export function setRandomSource(source: RandomSource): void {
  currentSource = source;
}

export function resetRandomSource(): void {
  currentSource = defaultSource;
}
