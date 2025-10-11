/**
 * movement_kernel.ts
 * Hex axial movement with Dijkstra + explicit failure reasons.
 * 
 * Features:
 * - Axial coords (q,r), rectangular board
 * - Terrain costs: Plain(1), Forest(2), Bridge(1), Water/Mountain = impassable
 * - Dijkstra shortest path (weighted)
 * - tryMoveTo() -> returns discriminated MoveResult with reason + path + cost
 * - findReachToward() -> best reachable hex toward a target within budget
 * - Dynamic unit collision detection
 * 
 * Integration: Use with World Engine phase battle system
 */

type Team = 'RED' | 'BLUE';

interface Axial { q: number; r: number; }

const DIRS: Axial[] = [
  { q: +1, r: 0 }, { q: +1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: +1 }, { q: 0, r: +1 },
];

const key = (a: Axial) => `${a.q},${a.r}`;
const unkey = (s: string): Axial => { 
  const [q, r] = s.split(',').map(Number); 
  return { q, r }; 
};

function axialDistance(a: Axial, b: Axial) {
  const ax = a.q, az = a.r, ay = -ax - az;
  const bx = b.q, bz = b.r, by = -bx - bz;
  return (Math.abs(ax - bx) + Math.abs(ay - by) + Math.abs(az - bz)) / 2;
}

type Terrain = 'Plain' | 'Forest' | 'Water' | 'Mountain' | 'Bridge';

class Tile {
  constructor(public pos: Axial, public terrain: Terrain) {}
  
  get passable() {
    return this.terrain === 'Plain' || 
           this.terrain === 'Forest' || 
           this.terrain === 'Bridge';
  }
  
  get moveCost() {
    if (this.terrain === 'Plain') return 1;
    if (this.terrain === 'Bridge') return 1;
    if (this.terrain === 'Forest') return 2;
    return Number.POSITIVE_INFINITY;
  }
}

class Board {
  private tiles = new Map<string, Tile>();
  
  constructor(
    public width: number, 
    public height: number, 
    gen?: (pos: Axial) => Terrain
  ) {
    for (let q = 0; q < width; q++) {
      for (let r = 0; r < height; r++) {
        const pos = { q, r };
        const t = gen ? gen(pos) : 'Plain';
        this.tiles.set(key(pos), new Tile(pos, t));
      }
    }
  }
  
  inBounds(a: Axial) { 
    return a.q >= 0 && a.q < this.width && a.r >= 0 && a.r < this.height; 
  }
  
  tile(a: Axial) { 
    return this.tiles.get(key(a)); 
  }
  
  neighbors(a: Axial) {
    return DIRS.map(d => ({ q: a.q + d.q, r: a.r + d.r }))
               .filter(n => this.inBounds(n));
  }
}

class Unit {
  static _id = 1;
  id: string;
  alive = true;
  moved = false;
  
  constructor(
    public name: string,
    public team: Team,
    public pos: Axial,
    public move: number,
  ) { 
    this.id = `U${Unit._id++}`; 
  }
}

type MoveError =
  | 'NotAlive'
  | 'AlreadyMoved'
  | 'OutOfBounds'
  | 'DestImpassable'
  | 'DestOccupied'
  | 'NoPath'
  | 'BudgetExhausted'
  | 'ZeroProgress'
  | 'BlockedByUnit';

type MoveResult =
  | { ok: true; path: Axial[]; spent: number; end: Axial }
  | { ok: false; error: MoveError; detail?: string; path?: Axial[]; spent?: number };

interface State {
  board: Board;
  units: Unit[];
  isOccupied(pos: Axial, ignoreId?: string): boolean;
}

function makeState(board: Board, units: Unit[]): State {
  return {
    board, 
    units,
    isOccupied: (p, ignoreId) => 
      units.some(u => u.alive && key(u.pos) === key(p) && u.id !== ignoreId)
  };
}

/** Minimal priority queue for Dijkstra */
class MinQ<T> {
  private a: { k: number, v: T }[] = [];
  
  push(k: number, v: T) { 
    this.a.push({ k, v }); 
    this.a.sort((x, y) => x.k - y.k); 
  }
  
  pop(): { k: number, v: T } | undefined { 
    return this.a.shift(); 
  }
  
  get length() { 
    return this.a.length; 
  }
}

/**
 * Dijkstra from start; returns cost, prev, and visited set.
 * Blocks impassable tiles and occupied ones (except start).
 */
function dijkstra(
  state: State, 
  start: Axial, 
  budget: number, 
  blockers: (p: Axial) => boolean
) {
  const cost = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const q = new MinQ<Axial>();

  const startK = key(start);
  cost.set(startK, 0);
  prev.set(startK, null);
  q.push(0, start);

  while (q.length) {
    const cur = q.pop()!.v;
    const curK = key(cur);
    const curC = cost.get(curK)!;
    
    // Prune beyond budget
    if (curC > budget) continue;

    for (const n of state.board.neighbors(cur)) {
      const t = state.board.tile(n);
      if (!t || !t.passable) continue;
      if (blockers(n)) continue; // dynamic unit collision
      
      const step = t.moveCost;
      const nc = curC + step;
      const nk = key(n);
      
      if (nc > budget) continue;
      
      if (!cost.has(nk) || nc < cost.get(nk)!) {
        cost.set(nk, nc);
        prev.set(nk, curK);
        q.push(nc, n);
      }
    }
  }
  
  return { cost, prev };
}

function reconstructPath(prev: Map<string, string | null>, end: Axial): Axial[] | null {
  const endK = key(end);
  if (!prev.has(endK)) return null;
  
  const path: Axial[] = [];
  let cur: string | null = endK;
  
  while (cur) { 
    path.push(unkey(cur)); 
    cur = prev.get(cur) ?? null; 
  }
  
  path.reverse();
  return path;
}

/**
 * Core: attempt to move unit to dest.
 * Returns discriminated union with explicit failure reasons.
 */
function tryMoveTo(state: State, unit: Unit, dest: Axial): MoveResult {
  // Validation checks
  if (!unit.alive) return { ok: false, error: 'NotAlive' };
  if (unit.moved) return { ok: false, error: 'AlreadyMoved' };
  if (!state.board.inBounds(dest)) return { ok: false, error: 'OutOfBounds' };

  const t = state.board.tile(dest)!;
  if (!t.passable) return { ok: false, error: 'DestImpassable' };
  if (state.isOccupied(dest, unit.id)) return { ok: false, error: 'DestOccupied' };

  // Dynamic blockers: all occupied tiles except the unit's current tile
  const blockers = (p: Axial) => {
    const sameAsStart = key(p) === key(unit.pos);
    return !sameAsStart && state.isOccupied(p, unit.id);
  };

  const { cost, prev } = dijkstra(state, unit.pos, unit.move, blockers);

  const path = reconstructPath(prev, dest);
  if (!path) return { ok: false, error: 'NoPath' };

  // Spend is cost of dest
  const spent = cost.get(key(dest)) ?? Number.POSITIVE_INFINITY;
  if (spent === Number.POSITIVE_INFINITY) return { ok: false, error: 'NoPath' };
  if (spent > unit.move) return { ok: false, error: 'BudgetExhausted', path, spent };

  if (path.length <= 1) {
    return { 
      ok: false, 
      error: 'ZeroProgress', 
      detail: 'dest equals start', 
      path, 
      spent 
    };
  }

  // All good → move
  unit.pos = dest;
  unit.moved = true;
  return { ok: true, path, spent, end: dest };
}

/**
 * Quality-of-life: within budget, pick the reachable hex closest to 'target' (by hex distance).
 * Prefers lower path cost on ties. Returns null if nowhere to go.
 */
function findReachToward(state: State, unit: Unit, target: Axial): Axial | null {
  const blockers = (p: Axial) => {
    const sameAsStart = key(p) === key(unit.pos);
    return !sameAsStart && state.isOccupied(p, unit.id);
  };
  
  const { cost } = dijkstra(state, unit.pos, unit.move, blockers);
  
  // Consider all reachable keys (excluding start)
  const candidates: { pos: Axial; c: number; d: number }[] = [];
  
  // Convert Map entries to array to avoid downlevelIteration requirement
  const entries = Array.from(cost.entries());
  for (const [k, c] of entries) {
    const p = unkey(k);
    if (k === key(unit.pos)) continue;
    
    // only passable and not occupied
    const tile = state.board.tile(p);
    if (!tile?.passable) continue;
    if (state.isOccupied(p, unit.id)) continue;
    
    candidates.push({ pos: p, c, d: axialDistance(p, target) });
  }
  
  if (!candidates.length) return null;
  
  // Sort by distance to target, then by path cost
  candidates.sort((a, b) => (a.d - b.d) || (a.c - b.c));
  return candidates[0].pos;
}

// ============================================================================
// EXPORTS (for integration with World Engine)
// ============================================================================

export type {
  Axial,
  Terrain,
  Tile,
  Board,
  Unit,
  State,
  Team,
  MoveError,
  MoveResult,
};

export {
  tryMoveTo,
  findReachToward,
  makeState,
  axialDistance,
  key,
  unkey,
};

// ============================================================================
// DEMO / TESTING
// ============================================================================

/**
 * Demo: River crossing scenario with bridge routing
 * Run with: npx ts-node src/features/battle/movement_kernel.ts
 */
function demo() {
  console.log('=== Movement Kernel Demo ===\n');
  
  // 9x7 with river column q=4; bridge at (4,3); mountain cap at top
  const W = 9, H = 7;
  const RIVER_Q = 4;
  const BRIDGE: Axial = { q: RIVER_Q, r: 3 };
  
  const board = new Board(W, H, (p) => {
    if (p.r === 0 && (p.q === 2 || p.q === 3 || p.q === 4)) return 'Mountain';
    if (p.q === RIVER_Q) return (p.r === BRIDGE.r ? 'Bridge' : 'Water');
    if ((p.q + p.r) % 5 === 0) return 'Forest';
    return 'Plain';
  });

  // Units: Red left, Blue right, leaving bridge free
  const red = new Unit('Red Knight', 'RED', { q: 1, r: 5 }, 3);
  const blue = new Unit('Blue Knight', 'BLUE', { q: 7, r: 1 }, 3);
  const s = makeState(board, [red, blue]);

  console.log('[SETUP] Red at', red.pos, 'Blue at', blue.pos);
  console.log('[INFO] Trying to cross to (5,3) by routing over bridge at (4,3).\n');

  // 1) Ask for the ideal reachable hex *toward* the enemy
  const target = blue.pos;
  const step = findReachToward(s, red, target);
  
  if (!step) {
    console.log('❌ No reachable step this turn (blocked or budget too low).');
    return;
  }
  
  console.log('→ Best reachable toward Blue:', step);

  // 2) Execute the move with full error reporting
  const res = tryMoveTo(s, red, step);
  
  if (!res.ok) {
    console.log('❌ MOVE FAIL:', res.error, res.detail ?? '');
    if (res.path) console.log('   path:', res.path);
    return;
  }

  console.log('✅ MOVE OK. Spent', res.spent, '→ end', res.end);
  console.log('   path:', res.path.map(p => `(${p.q},${p.r})`).join(' → '));

  // 3) Show that we didn't step into water; the bridge is the only crossing
  const steppedTiles = res.path.slice(1).map(p => board.tile(p)!.terrain);
  console.log('   terrains:', steppedTiles.join(', '));
  console.log('\n✅ Demo complete!');
}

// Run demo if executed directly
if (require.main === module) {
  demo();
}
