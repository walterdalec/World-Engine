export function seedRng(seed: number) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const rngInt = (rand: () => number, min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;

export const rngBool = (rand: () => number, p = 0.5) => rand() < p;

export const rngPick = <T>(rand: () => number, arr: T[]): T => {
  if (!arr.length) throw new Error('Cannot pick from empty array');
  return arr[Math.floor(rand() * arr.length)];
};
