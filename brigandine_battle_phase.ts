/** brigandine_battle_phase.ts
 * Minimal Brigandine-style battle phase demo
 * - Hex (axial) coords
 * - Phase order: RED -> BLUE -> ...
 * - Each unit: up to 1 Move + 1 Attack per phase
 * - BFS pathfinding on a rhombus axial board
 * - Terrain: Plain, Forest (cost 2), Water/Mountain (impassable), Bridge (cost 1)
 * - Headless auto-AI for demo: move toward nearest enemy; attack if in range
 */

type Team = 'RED' | 'BLUE';

interface Axial { q: number; r: number; }
const AXIAL_DIRS: Axial[] = [
    { q: +1, r: 0 }, { q: +1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: +1 }, { q: 0, r: +1 },
];

function axialEq(a: Axial, b: Axial) { return a.q === b.q && a.r === b.r; }
function axialAdd(a: Axial, b: Axial): Axial { return { q: a.q + b.q, r: a.r + b.r }; }
function axialNeighbors(a: Axial): Axial[] { return AXIAL_DIRS.map(d => axialAdd(a, d)); }
function axialToKey(a: Axial) { return `${a.q},${a.r}`; }
function axialFromKey(k: string): Axial { const [q, r] = k.split(',').map(Number); return { q, r }; }
function axialDistance(a: Axial, b: Axial): number {
    // Convert axial(q,r) to cube(x,y,z) with x=q, z=r, y=-x-z
    const ax = a.q, az = a.r, ay = -ax - az;
    const bx = b.q, bz = b.r, by = -bx - bz;
    return (Math.abs(ax - bx) + Math.abs(ay - by) + Math.abs(az - bz)) / 2;
}

/** RNG with seed for deterministic demo */
class RNG {
    private s: number;
    constructor(seed = 123456789) { this.s = seed >>> 0; }
    next() { // xorshift32
        let x = this.s;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        this.s = x >>> 0;
        return this.s;
    }
    float() { return this.next() / 0xFFFFFFFF; }
    int(min: number, max: number) { return Math.floor(this.float() * (max - min + 1)) + min; }
}

type Terrain = 'Plain' | 'Forest' | 'Water' | 'Mountain' | 'Bridge';

class Tile {
    readonly pos: Axial;
    readonly terrain: Terrain;
    constructor(pos: Axial, terrain: Terrain) {
        this.pos = pos; this.terrain = terrain;
    }
    get passable(): boolean {
        return this.terrain === 'Plain' || this.terrain === 'Forest' || this.terrain === 'Bridge';
    }
    get moveCost(): number {
        if (this.terrain === 'Forest') return 2;
        if (this.terrain === 'Bridge') return 1;
        if (this.terrain === 'Plain') return 1;
        return Number.POSITIVE_INFINITY; // impassable
    }
}

class Board {
    readonly width: number; readonly height: number;
    private tiles: Map<string, Tile> = new Map();
    constructor(width: number, height: number, generator?: (pos: Axial) => Terrain) {
        this.width = width; this.height = height;
        for (let q = 0; q < width; q++) {
            for (let r = 0; r < height; r++) {
                const pos = { q, r };
                const terrain = generator ? generator(pos) : 'Plain';
                this.tiles.set(axialToKey(pos), new Tile(pos, terrain));
            }
        }
    }
    inBounds(a: Axial): boolean {
        return a.q >= 0 && a.q < this.width && a.r >= 0 && a.r < this.height;
    }
    tile(a: Axial): Tile | undefined { return this.tiles.get(axialToKey(a)); }
    neighborsPassable(a: Axial): Axial[] {
        return axialNeighbors(a).filter(n => this.inBounds(n) && (this.tile(n)?.passable ?? false));
    }
}

let UNIT_ID_COUNTER = 1;
class Unit {
    readonly id: string;
    readonly name: string;
    readonly team: Team;
    pos: Axial;
    readonly maxHp: number;
    hp: number;
    readonly attack: number;
    readonly defense: number;
    readonly move: number;   // move points per phase
    readonly range: number;  // attack range in hexes
    readonly speed: number;  // not used for initiative in this phased model, but kept for future
    // per-phase action flags
    movedThisPhase = false;
    attackedThisPhase = false;
    alive = true;

    constructor(args: {
        name: string; team: Team; pos: Axial; maxHp: number; attack: number; defense: number;
        move: number; range: number; speed?: number;
    }) {
        this.id = `U${UNIT_ID_COUNTER++}`;
        this.name = args.name;
        this.team = args.team;
        this.pos = args.pos;
        this.maxHp = args.maxHp;
        this.hp = args.maxHp;
        this.attack = args.attack;
        this.defense = args.defense;
        this.move = args.move;
        this.range = args.range;
        this.speed = args.speed ?? 10;
    }

    resetPhaseFlags() { this.movedThisPhase = false; this.attackedThisPhase = false; }
}

type BattleEvent =
    | { type: 'StartPhase'; team: Team; round: number }
    | { type: 'EndPhase'; team: Team }
    | { type: 'Move'; unitId: string; from: Axial; to: Axial }
    | { type: 'Attack'; attackerId: string; defenderId: string }
    | { type: 'Damage'; targetId: string; amount: number; remaining: number }
    | { type: 'Death'; unitId: string }
    | { type: 'BattleEnd'; winner: Team | 'DRAW'; round: number };

class BattleState {
    readonly board: Board;
    readonly units: Map<string, Unit>;
    phase: Team;
    round: number;

    constructor(board: Board, units: Unit[], firstPhase: Team = 'RED') {
        this.board = board;
        this.units = new Map(units.map(u => [u.id, u]));
        this.phase = firstPhase;
        this.round = 1;
    }
    unitsOf(team: Team): Unit[] { return [...this.units.values()].filter(u => u.team === team && u.alive); }
    enemiesOf(team: Team): Unit[] { return [...this.units.values()].filter(u => u.team !== team && u.alive); }
    at(pos: Axial): Unit | undefined { return [...this.units.values()].find(u => u.alive && axialEq(u.pos, pos)); }
    isOccupied(pos: Axial): boolean { return !!this.at(pos); }
    resetPhaseFlagsFor(team: Team) { this.unitsOf(team).forEach(u => u.resetPhaseFlags()); }
    aliveTeams(): Team[] {
        const redAlive = this.unitsOf('RED').length > 0;
        const blueAlive = this.unitsOf('BLUE').length > 0;
        return (redAlive && blueAlive) ? ['RED', 'BLUE'] : (redAlive ? ['RED'] : (blueAlive ? ['BLUE'] : []));
    }
}

class Engine {
    readonly rng: RNG;
    readonly state: BattleState;
    readonly events: BattleEvent[] = [];

    constructor(state: BattleState, rngSeed = 1337) {
        this.state = state;
        this.rng = new RNG(rngSeed);
    }

    log(ev: BattleEvent) { this.events.push(ev); }

    startPhase() {
        const t = this.state.phase;
        if (t === 'RED' && this.state.round === 1) {
            // first call—ensure flags reset
            this.state.resetPhaseFlagsFor('RED');
            this.state.resetPhaseFlagsFor('BLUE');
        } else {
            this.state.resetPhaseFlagsFor(t);
        }
        this.log({ type: 'StartPhase', team: t, round: this.state.round });
    }

    endPhase() {
        const t = this.state.phase;
        this.log({ type: 'EndPhase', team: t });
        // swap phase
        this.state.phase = t === 'RED' ? 'BLUE' : 'RED';
        if (this.state.phase === 'RED') this.state.round++;
    }

    /** BFS path; returns path including start and dest, or null */
    findPath(start: Axial, goal: Axial, unit: Unit): Axial[] | null {
        if (!this.state.board.inBounds(goal)) return null;
        const goalTile = this.state.board.tile(goal);
        if (!goalTile || !goalTile.passable) return null;

        const cameFrom = new Map<string, string | null>();
        const costSoFar = new Map<string, number>();

        const startKey = axialToKey(start);
        cameFrom.set(startKey, null);
        costSoFar.set(startKey, 0);

        const q: Axial[] = [start];
        while (q.length) {
            const current = q.shift()!;
            const curKey = axialToKey(current);
            if (axialEq(current, goal)) break;

            for (const next of this.state.board.neighborsPassable(current)) {
                // cannot path through occupied tiles (except goal if the goal is empty; if occupied, path fails)
                if (this.state.isOccupied(next) && !axialEq(next, goal)) continue;

                const tile = this.state.board.tile(next)!;
                const newCost = (costSoFar.get(curKey) ?? Infinity) + tile.moveCost;
                const nextKey = axialToKey(next);
                if (!costSoFar.has(nextKey) || newCost < (costSoFar.get(nextKey) as number)) {
                    costSoFar.set(nextKey, newCost);
                    cameFrom.set(nextKey, curKey);
                    q.push(next);
                }
            }
        }

        const goalKey = axialToKey(goal);
        if (!cameFrom.has(goalKey)) return null;

        // reconstruct path
        const path: Axial[] = [];
        let cur: string | null = goalKey;
        while (cur) {
            path.push(axialFromKey(cur));
            cur = cameFrom.get(cur) ?? null;
        }
        path.reverse();
        return path;
    }

    /** Move up to unit.move along path to 'to'. Returns true on success. */
    move(unit: Unit, to: Axial): boolean {
        if (!unit.alive) return false;
        if (unit.movedThisPhase) return false;
        if (!this.state.board.inBounds(to)) return false;
        if (this.state.isOccupied(to)) return false;

        const path = this.findPath(unit.pos, to, unit);
        if (!path) return false;

        // Count cost along the path (excluding start)
        let spent = 0;
        let last = unit.pos;
        let final = unit.pos;
        for (let i = 1; i < path.length; i++) {
            const step = path[i];
            const tile = this.state.board.tile(step)!;
            const cost = tile.moveCost;
            if (spent + cost > unit.move) break;
            // cannot step into occupied tiles mid-way
            if (this.state.isOccupied(step)) break;
            spent += cost;
            last = final;
            final = step;
        }
        if (axialEq(final, unit.pos)) return false;

        const from = { ...unit.pos };
        unit.pos = final;
        unit.movedThisPhase = true;
        this.log({ type: 'Move', unitId: unit.id, from, to: { ...final } });
        return true;
    }

    canAttack(attacker: Unit, defender: Unit): boolean {
        if (!attacker.alive || !defender.alive) return false;
        if (attacker.attackedThisPhase) return false;
        if (attacker.team === defender.team) return false;
        const dist = axialDistance(attacker.pos, defender.pos);
        return dist <= attacker.range;
    }

    /** Attack, apply damage + death. Returns true if an attack occurred. */
    attack(attacker: Unit, defender: Unit): boolean {
        if (!this.canAttack(attacker, defender)) return false;

        this.log({ type: 'Attack', attackerId: attacker.id, defenderId: defender.id });

        // simple chance-to-hit and damage model
        const hitChance = 0.9; // 90%
        const hitRoll = this.rng.float();
        if (hitRoll > hitChance) {
            // Miss → 0 damage event for clarity
            this.log({ type: 'Damage', targetId: defender.id, amount: 0, remaining: defender.hp });
            attacker.attackedThisPhase = true;
            return true;
        }

        // damage = max(1, atk + variance - def)
        const variance = this.rng.int(-2, 2);
        const dmg = Math.max(1, attacker.attack + variance - defender.defense);
        defender.hp = Math.max(0, defender.hp - dmg);
        this.log({ type: 'Damage', targetId: defender.id, amount: dmg, remaining: defender.hp });
        attacker.attackedThisPhase = true;

        if (defender.hp <= 0 && defender.alive) {
            defender.alive = false;
            this.log({ type: 'Death', unitId: defender.id });
        }
        return true;
    }

    /** Auto-behavior for demo: for each unit on current team, move toward nearest enemy, then attack if possible. */
    runPhaseAuto() {
        this.startPhase();
        const team = this.state.phase;
        const myUnits = this.state.unitsOf(team);
        const enemies = this.state.enemiesOf(team);
        if (enemies.length === 0) {
            this.finishIfOver(); return;
        }

        // For each unit: if enemy in range -> attack nearest; else move toward nearest
        for (const u of myUnits) {
            if (!u.alive) continue;

            const nearest = this.nearestEnemy(u, enemies);
            if (!nearest) continue;

            const dist = axialDistance(u.pos, nearest.pos);
            if (dist <= u.range && !u.attackedThisPhase) {
                this.attack(u, nearest);
            } else if (!u.movedThisPhase) {
                // try to step closer
                const stepTarget = this.stepToward(u, nearest);
                if (stepTarget) this.move(u, stepTarget);
                // After moving, check attack again (Brigandine allows move+attack)
                if (axialDistance(u.pos, nearest.pos) <= u.range && !u.attackedThisPhase) {
                    this.attack(u, nearest);
                }
            }
        }

        this.endPhase();
        this.finishIfOver();
    }

    nearestEnemy(u: Unit, candidates: Unit[]): Unit | null {
        let best: Unit | null = null;
        let bestD = Infinity;
        for (const e of candidates) {
            const d = axialDistance(u.pos, e.pos);
            if (d < bestD) { bestD = d; best = e; }
        }
        return best;
    }

    /** Choose a reachable hex closer to target within move budget (greedy one-step). */
    stepToward(u: Unit, target: Unit): Axial | null {
        // Explore neighbors and pick the one that yields the smallest distance to target and is walkable+unoccupied
        const neighbors = axialNeighbors(u.pos).filter(n =>
            this.state.board.inBounds(n) &&
            (this.state.board.tile(n)?.passable ?? false) &&
            !this.state.isOccupied(n)
        );
        if (!neighbors.length) return null;

        // Only consider neighbors whose cost <= move budget
        const feasible = neighbors.filter(n => (this.state.board.tile(n)?.moveCost ?? Infinity) <= u.move);
        if (!feasible.length) return null;

        feasible.sort((a, b) => axialDistance(a, target.pos) - axialDistance(b, target.pos));
        return feasible[0];
    }

    finishIfOver() {
        const alive = this.state.aliveTeams();
        if (alive.length <= 1) {
            const winner: Team | 'DRAW' = alive.length === 1 ? alive[0] : 'DRAW';
            this.log({ type: 'BattleEnd', winner, round: this.state.round });
        }
    }
}

/** ------------------------- DEMO BOOTSTRAP ------------------------- **/

function sampleBoard(): Board {
    // 9x7 board with a little river & forest & bridge
    const W = 9, H = 7;
    const riverColumn = 4; // a vertical water column with one bridge
    const bridgeAt: Axial = { q: riverColumn, r: 3 };

    return new Board(W, H, (pos) => {
        // thin mountain ridge on top row; river down the middle; some forests
        if (pos.r === 0 && (pos.q === 2 || pos.q === 3 || pos.q === 4)) return 'Mountain';
        if (pos.q === riverColumn) {
            if (axialEq(pos, bridgeAt)) return 'Bridge';
            return 'Water';
        }
        // sprinkle forests
        if ((pos.q + pos.r) % 5 === 0) return 'Forest';
        return 'Plain';
    });
}

function sampleUnits(): Unit[] {
    // RED left, BLUE right
    return [
        new Unit({ name: 'Red Knight', team: 'RED', pos: { q: 1, r: 5 }, maxHp: 18, attack: 7, defense: 4, move: 3, range: 1 }),
        new Unit({ name: 'Red Archer', team: 'RED', pos: { q: 0, r: 3 }, maxHp: 12, attack: 5, defense: 2, move: 2, range: 3 }),
        new Unit({ name: 'Red Mage', team: 'RED', pos: { q: 1, r: 2 }, maxHp: 10, attack: 6, defense: 1, move: 2, range: 2 }),

        new Unit({ name: 'Blue Knight', team: 'BLUE', pos: { q: 7, r: 1 }, maxHp: 18, attack: 7, defense: 4, move: 3, range: 1 }),
        new Unit({ name: 'Blue Archer', team: 'BLUE', pos: { q: 8, r: 3 }, maxHp: 12, attack: 5, defense: 2, move: 2, range: 3 }),
        new Unit({ name: 'Blue Mage', team: 'BLUE', pos: { q: 7, r: 5 }, maxHp: 10, attack: 6, defense: 1, move: 2, range: 2 }),
    ];
}

function runAutoBattle(maxRounds = 20) {
    const board = sampleBoard();
    const units = sampleUnits();
    const state = new BattleState(board, units, 'RED');
    const engine = new Engine(state, 20251010);

    // Run phases until winner or maxRounds
    while (engine.events.find(e => e.type === 'BattleEnd') === undefined && state.round <= maxRounds) {
        engine.runPhaseAuto();
    }

    // Print compact log
    printLog(engine, state);
}

function printLog(engine: Engine, state: BattleState) {
    const unitName = (id: string) => state.units.get(id)?.name ?? id;
    for (const e of engine.events) {
        switch (e.type) {
            case 'StartPhase': console.log(`[Phase Start] ${e.team} (Round ${e.round})`); break;
            case 'EndPhase': console.log(`[Phase End]   ${e.team}`); break;
            case 'Move': {
                const u = unitName(e.unitId);
                console.log(`🎲 Move: ${u} ${coordStr(e.from)} → ${coordStr(e.to)}`);
                break;
            }
            case 'Attack': {
                console.log(`⚔️  Attack: ${unitName(e.attackerId)} → ${unitName(e.defenderId)}`);
                break;
            }
            case 'Damage': {
                const tag = e.amount === 0 ? 'MISS' : `-${e.amount} HP`;
                console.log(`   • ${unitName(e.targetId)} ${tag} (HP ${e.remaining})`);
                break;
            }
            case 'Death': {
                console.log(`💀 ${unitName(e.unitId)} is defeated`);
                break;
            }
            case 'BattleEnd': {
                console.log(`🏁 Battle End — Winner: ${e.winner} (Round ${e.round})`);
                break;
            }
        }
    }
}

function coordStr(a: Axial) { return `(q:${a.q}, r:${a.r})`; }

// Kick off the demo when run via node/ts-node
if (require.main === module) {
    runAutoBattle(30);
}
