/** xorshift32 seeded RNG for deterministic battles */
export class RNG {
  private state: number;
  constructor(seed: string) {
    this.state = RNG.hash(seed);
  }
  static hash(s: string) {
    let h = 2166136261 >>> 0;
    for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  next() {
    let x = (this.state + 0x9e3779b9) >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return (this.state >>> 0) / 0x100000000;
  }
  int(min:number, max:number){ return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(arr: readonly T[]){ return arr[this.int(0, arr.length-1)]; }
}
