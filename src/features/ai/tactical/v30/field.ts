export interface Hex {
  q: number;
  r: number;
}

export interface FieldCell {
  threat: number;
  support: number;
  cover: number;
  hazard: number;
  intent: number;
}

export interface ThreatField {
  grid: Record<string, FieldCell>;
  ts: number;
  seed: number;
}

const K = {
  threatFalloff: 0.85,
  supportFalloff: 0.9,
  coverBonus: 0.2,
  hazardPenalty: 0.4,
  intentPull: 0.6,
};

export function key(h: Hex): string {
  return `${h.q},${h.r}`;
}

export function createField(seed: number): ThreatField {
  return { grid: {}, ts: 0, seed };
}

export function addThreat(tf: ThreatField, at: Hex, power: number): void {
  for (const hex of ring(at, 0, 6)) {
    const dist = hexDist(at, hex);
    const w = power * Math.pow(K.threatFalloff, dist);
    cell(tf, hex).threat += w;
  }
}

export function addSupport(tf: ThreatField, at: Hex, power: number): void {
  for (const hex of ring(at, 0, 4)) {
    const dist = hexDist(at, hex);
    cell(tf, hex).support += power * Math.pow(K.supportFalloff, dist);
  }
}

export function addCover(tf: ThreatField, at: Hex, strength: number): void {
  cell(tf, at).cover += strength * K.coverBonus;
}

export function addHazard(tf: ThreatField, at: Hex, strength: number): void {
  cell(tf, at).hazard += strength * K.hazardPenalty;
}

export function addIntent(tf: ThreatField, target: Hex, weight: number): void {
  cell(tf, target).intent += weight * K.intentPull;
}

export function decay(tf: ThreatField, factor = 0.95): void {
  for (const c of Object.values(tf.grid)) {
    c.threat *= factor;
    c.support *= factor;
    c.intent *= factor;
    c.cover *= factor;
    c.hazard *= factor;
  }
}

export function scoreHex(tf: ThreatField, h: Hex): { danger: number; pull: number } {
  const c = tf.grid[key(h)] ?? { threat: 0, support: 0, cover: 0, hazard: 0, intent: 0 };
  const danger = Math.max(0, c.threat - c.support) + c.hazard - c.cover;
  const pull = c.intent;
  return { danger, pull };
}

function cell(tf: ThreatField, h: Hex): FieldCell {
  const k = key(h);
  if (!tf.grid[k]) {
    tf.grid[k] = { threat: 0, support: 0, cover: 0, hazard: 0, intent: 0 };
  }
  return tf.grid[k]!;
}

function hexDist(a: Hex, b: Hex): number {
  const ax = a.q;
  const az = -a.q - a.r;
  const ay = a.r;
  const bx = b.q;
  const bz = -b.q - b.r;
  const by = b.r;
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

function ring(center: Hex, r0: number, r1: number): Hex[] {
  const out: Hex[] = [];
  for (let radius = r0; radius <= r1; radius += 1) {
    for (let q = -radius; q <= radius; q += 1) {
      const s = radius - Math.abs(q);
      for (let t = -s; t <= s; t += Math.max(1, 2 * s)) {
        out.push({ q: center.q + q, r: center.r + t });
      }
    }
  }
  return out;
}
