import React, { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Brigandine x M&M Hex Tactical — World Engine Integration
 * ---------------------------------------------------------
 * Enhanced version with:
 * - World Engine species and archetypes
 * - Improved visual design
 * - Better controls and feedback
 * - Integration-ready for strategic layer
 */

// ------------------------ Utility: Seeded RNG ------------------------
function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashStringToSeed(str: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// ------------------------ Hex Math ------------------------
const SQRT3 = Math.sqrt(3);
const HEX_SIZE_BASE = 32;

type Axial = { q: number; r: number };

function axialEq(a: Axial, b: Axial) {
    return a.q === b.q && a.r === b.r;
}

function axialKey(a: Axial) {
    return `${a.q},${a.r}`;
}

function axialToPixel(a: Axial, size: number) {
    const x = size * SQRT3 * (a.q + a.r / 2);
    const y = size * (3 / 2) * a.r;
    return { x, y };
}

const HEX_DIRS: Axial[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
];

function add(a: Axial, b: Axial): Axial {
    return { q: a.q + b.q, r: a.r + b.r };
}

function neighbors(a: Axial): Axial[] {
    return HEX_DIRS.map((d) => add(a, d));
}

function cubeDistance(a: Axial, b: Axial) {
    const s1 = -a.q - a.r;
    const s2 = -b.q - b.r;
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(s1 - s2)) / 2;
}

function hexLine(a: Axial, b: Axial): Axial[] {
    const N = cubeDistance(a, b);
    const results: Axial[] = [];
    for (let i = 0; i <= N; i++) {
        const t = N === 0 ? 0 : i / N;
        results.push(hexRound(hexLerp(a, b, t)));
    }
    return results;
}

function hexLerp(a: Axial, b: Axial, t: number): { q: number; r: number; s: number } {
    const aq = a.q;
    const ar = a.r;
    const as = -aq - ar;
    const bq = b.q;
    const br = b.r;
    const bs = -bq - br;
    return {
        q: aq + (bq - aq) * t,
        r: ar + (br - ar) * t,
        s: as + (bs - as) * t,
    };
}

function hexRound(h: { q: number; r: number; s: number }): Axial {
    let rq = Math.round(h.q);
    let rr = Math.round(h.r);
    let rs = Math.round(h.s);

    const q_diff = Math.abs(rq - h.q);
    const r_diff = Math.abs(rr - h.r);
    const s_diff = Math.abs(rs - h.s);

    if (q_diff > r_diff && q_diff > s_diff) {
        rq = -rr - rs;
    } else if (r_diff > s_diff) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
}

// ------------------------ Terrain & Map ------------------------
const TERRAIN = {
    Plains: { move: 1, defense: 0, block: false, color: "#e5d4b5", icon: "🌾" },
    Forest: { move: 2, defense: 1, block: true, color: "#7fa871", icon: "🌲" },
    Hills: { move: 2, defense: 1, block: false, color: "#c2b280", icon: "⛰️" },
    Mountain: { move: 999, defense: 2, block: true, color: "#8b8680", icon: "🏔️" },
    Water: { move: 3, defense: -1, block: false, color: "#6ba3c7", icon: "🌊" },
    Ruins: { move: 1, defense: 2, block: true, color: "#a89084", icon: "🏛️" },
} as const;

type TerrainKey = keyof typeof TERRAIN;

type Tile = {
    pos: Axial;
    terrain: TerrainKey;
    elev: number;
    road: boolean;
};

function genMap(radius: number, seedStr: string) {
    const seed = hashStringToSeed(seedStr);
    const _rnd = mulberry32(seed);
    const tiles = new Map<string, Tile>();

    function noise(q: number, r: number) {
        const n = Math.sin((q * 374761393 + r * 668265263 + seed) * 0.000001);
        return n - Math.floor(n);
    }

    for (let q = -radius; q <= radius; q++) {
        for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
            const n = noise(q, r);
            let terrain: TerrainKey = "Plains";
            if (n < 0.18) terrain = "Water";
            else if (n < 0.36) terrain = "Plains";
            else if (n < 0.58) terrain = "Forest";
            else if (n < 0.78) terrain = "Hills";
            else if (n < 0.92) terrain = "Mountain";
            else terrain = "Ruins";
            const elev = Math.floor(noise(q + 42, r - 17) * 4);
            const road = noise(q * 3, r * 3) > 0.8 && terrain !== "Water" && terrain !== "Mountain";
            tiles.set(axialKey({ q, r }), { pos: { q, r }, terrain, elev, road });
        }
    }
    return tiles;
}

// ------------------------ Units & Turn Order ------------------------

type Team = "Blue" | "Red";

type Unit = {
    id: string;
    name: string;
    archetype: string; // World Engine archetype
    team: Team;
    pos: Axial;
    hp: number;
    maxHp: number;
    ap: number;
    maxAp: number;
    move: number;
    range: number;
    atk: number;
    def: number;
    spd: number;
    zoc: boolean;
    flyer?: boolean;
};

function baseUnits(): Unit[] {
    return [
        {
            id: "u1",
            name: "Sir Aldric",
            archetype: "knight",
            team: "Blue",
            pos: { q: -2, r: 2 },
            hp: 32,
            maxHp: 32,
            ap: 2,
            maxAp: 2,
            move: 4,
            range: 1,
            atk: 9,
            def: 6,
            spd: 7,
            zoc: true,
        },
        {
            id: "u2",
            name: "Lyra Windshot",
            archetype: "ranger",
            team: "Blue",
            pos: { q: -3, r: 1 },
            hp: 22,
            maxHp: 22,
            ap: 2,
            maxAp: 2,
            move: 5,
            range: 3,
            atk: 6,
            def: 3,
            spd: 9,
            zoc: false,
        },
        {
            id: "u3",
            name: "Grimlok",
            archetype: "knight",
            team: "Red",
            pos: { q: 2, r: -1 },
            hp: 20,
            maxHp: 20,
            ap: 2,
            maxAp: 2,
            move: 4,
            range: 1,
            atk: 7,
            def: 3,
            spd: 6,
            zoc: true,
        },
        {
            id: "u4",
            name: "Zix Shadowdart",
            archetype: "corsair",
            team: "Red",
            pos: { q: 3, r: -2 },
            hp: 16,
            maxHp: 16,
            ap: 2,
            maxAp: 2,
            move: 6,
            range: 3,
            atk: 5,
            def: 2,
            spd: 10,
            zoc: false,
            flyer: true,
        },
    ];
}

// ------------------------ Movement & LOS ------------------------

type MoveResult = {
    reachable: Map<string, { cost: number; prev?: Axial }>;
    frontier: Axial[];
};

function movementCosts(tile: Tile, flyer: boolean): number {
    if (flyer) return 1;
    const base = TERRAIN[tile.terrain].move;
    if (tile.road) {
        const reduced = base - 1;
        return reduced < 1 ? 1 : reduced;
    }
    return base >= 999 ? 999 : base;
}

function computeReachable(tiles: Map<string, Tile>, units: Unit[], who: Unit): MoveResult {
    const max = who.move;
    const reachable = new Map<string, { cost: number; prev?: Axial }>();
    const frontier: Axial[] = [];

    const unitAt = new Map<string, Unit>();
    for (const u of units) unitAt.set(axialKey(u.pos), u);

    const enemyAdjacency = (p: Axial) =>
        neighbors(p).some((n) => {
            const u = unitAt.get(axialKey(n));
            return u && u.team !== who.team && u.zoc;
        });

    const startKey = axialKey(who.pos);
    reachable.set(startKey, { cost: 0 });
    frontier.push(who.pos);

    while (frontier.length) {
        frontier.sort((a, b) => (reachable.get(axialKey(a))!.cost - reachable.get(axialKey(b))!.cost));
        const current = frontier.shift()!;
        const currentKey = axialKey(current);
        const costHere = reachable.get(currentKey)!.cost;

        for (const n of neighbors(current)) {
            const t = tiles.get(axialKey(n));
            if (!t) continue;
            const occupant = unitAt.get(axialKey(n));
            if (occupant && !axialEq(n, who.pos)) {
                continue;
            }
            const stepCost = movementCosts(t, !!who.flyer);
            if (stepCost >= 999) continue;
            let newCost = costHere + stepCost;

            if (newCost > max) continue;

            const k = axialKey(n);
            const prev = reachable.get(k);
            if (!prev || newCost < prev.cost) {
                reachable.set(k, { cost: newCost, prev: current });
                if (!enemyAdjacency(n) || axialEq(n, who.pos)) {
                    frontier.push(n);
                }
            }
        }
    }

    return { reachable, frontier: [] };
}

function losClear(tiles: Map<string, Tile>, units: Unit[], a: Axial, b: Axial, flyer: boolean) {
    const line = hexLine(a, b);
    const unitAt = new Map<string, Unit>();
    for (const u of units) unitAt.set(axialKey(u.pos), u);

    for (let i = 1; i < line.length - 1; i++) {
        const k = axialKey(line[i]);
        const t = tiles.get(k);
        if (!t) return false;
        if (unitAt.has(k)) return false;
        if (!flyer && TERRAIN[t.terrain].block) return false;
    }
    return true;
}

// ------------------------ Dice & Combat ------------------------
function roll(n: number, faces: number) {
    let s = 0;
    for (let i = 0; i < n; i++) s += 1 + Math.floor(Math.random() * faces);
    return s;
}

function resolveAttack(attacker: Unit, defender: Unit, terrain: Tile) {
    const atkRoll = roll(1, 20) + attacker.atk;
    const defRoll = roll(1, 20) + defender.def + TERRAIN[terrain.terrain].defense;
    const hit = atkRoll >= defRoll;
    let dmg = 0;
    if (hit) {
        dmg = Math.max(1, Math.floor(roll(1, 8) + attacker.atk * 0.5 - defender.def * 0.25));
    }
    return { hit, dmg, atkRoll, defRoll };
}

// ------------------------ React Component ------------------------
export default function BrigandineHexBattle({ onBack }: { onBack?: () => void }) {
    const [radius, setRadius] = useState(6);
    const [seed, setSeed] = useState("Vale-Skirmish");
    const [tiles, setTiles] = useState(() => genMap(radius, seed));
    const [units, setUnits] = useState<Unit[]>(() => baseUnits());
    const [selected, setSelected] = useState<string | null>("u2");
    const [mode, setMode] = useState<"move" | "attack">("move");
    const [logs, setLogs] = useState<string[]>(["⚔️ Battle begins at Vale Skirmish"]);
    const [showGrid, setShowGrid] = useState(true);
    const [showLOS, setShowLOS] = useState(true);
    const [hexSize, setHexSize] = useState(HEX_SIZE_BASE);
    const [round, setRound] = useState(1);
    const [_turnQueue, setTurnQueue] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const unitMap = useMemo(() => {
        const m = new Map<string, Unit>();
        for (const u of units) m.set(u.id, u);
        return m;
    }, [units]);

    const active = activeId ? unitMap.get(activeId) ?? null : null;
    const selectedUnit = selected ? unitMap.get(selected) ?? null : null;

    const reach = useMemo(() => {
        if (!selectedUnit) return null;
        return computeReachable(tiles, units, selectedUnit);
    }, [tiles, units, selectedUnit]);

    const startRound = useCallback(() => {
        setUnits((prev) => prev.map((u) => ({ ...u, ap: u.maxAp })));
        const order = [...units]
            .filter((u) => u.hp > 0)
            .sort((a, b) => b.spd - a.spd)
            .map((u) => u.id);
        setTurnQueue(order);
        setActiveId(order[0] ?? null);
        setRound((r) => (r === 1 ? 1 : r));
        setLogs((l) => [
            `🎲 Round ${round} - Initiative: ${order.map((id) => unitMap.get(id)?.name || id).join(" → ")}`,
            ...l,
        ]);
    }, [units, unitMap, round]);

    useEffect(() => {
        startRound();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function nextTurn() {
        setTurnQueue((q) => {
            const [, ...rest] = q;
            if (rest.length === 0) {
                setRound((r) => r + 1);
                setUnits((prev) => prev.map((u) => ({ ...u, ap: u.maxAp })));
                const order = [...units]
                    .filter((u) => u.hp > 0)
                    .sort((a, b) => b.spd - a.spd)
                    .map((u) => u.id);
                setActiveId(order[0] ?? null);
                setLogs((l) => [`🔄 Round ${round + 1} begins`, ...l]);
                return order;
            } else {
                setActiveId(rest[0]);
                return rest;
            }
        });
    }

    function tileAt(a: Axial) {
        return tiles.get(axialKey(a));
    }

    function unitAt(a: Axial) {
        return units.find((u) => axialEq(u.pos, a));
    }

    function damageUnit(id: string, amount: number) {
        setUnits((prev) =>
            prev.map((u) => (u.id === id ? { ...u, hp: Math.max(0, u.hp - amount) } : u))
        );
    }

    const hexPointsCache = useMemo(() => {
        const pts: string[] = [];
        const s = hexSize;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 180) * (60 * i - 30);
            const x = s * Math.cos(angle);
            const y = s * Math.sin(angle);
            pts.push(`${x},${y}`);
        }
        return pts.join(" ");
    }, [hexSize]);

    function onClickHex(p: Axial) {
        const act = activeId ? unitMap.get(activeId) : null;
        if (!act || act.hp <= 0) return;
        const targetUnit = unitAt(p);

        if (mode === "move") {
            if (!reach) {
                setLogs((l) => [`⚠️ No valid moves available for ${act.name}`, ...l]);
                return;
            }
            const info = reach.reachable.get(axialKey(p));
            if (!info) {
                // Clicking on unreachable tile - provide feedback
                if (targetUnit) {
                    setLogs((l) => [`⚠️ Cannot move to occupied hex (${p.q},${p.r})`, ...l]);
                } else {
                    const tileInfo = tileAt(p);
                    if (tileInfo) {
                        const terrainIcon = TERRAIN[tileInfo.terrain].icon;
                        setLogs((l) => [`⚠️ ${terrainIcon} at (${p.q},${p.r}) is out of range or blocked`, ...l]);
                    } else {
                        setLogs((l) => [`⚠️ Hex (${p.q},${p.r}) is out of range or blocked`, ...l]);
                    }
                }
                return;
            }

            // Valid move - execute it
            setUnits((prev) =>
                prev.map((u) => (u.id === act.id ? { ...u, pos: p, ap: Math.max(0, u.ap - 1) } : u))
            );
            setLogs((l) => [`📍 ${act.name} moves to (${p.q},${p.r})`, ...l]);
            setSelected(act.id);
            if (act.ap - 1 <= 0) nextTurn();
        } else if (mode === "attack") {
            if (!targetUnit) return;
            const dist = cubeDistance(act.pos, targetUnit.pos);
            if (dist > act.range) return;
            if (act.range > 1 && showLOS && !losClear(tiles, units, act.pos, targetUnit.pos, !!act.flyer)) return;

            const tTile = tileAt(targetUnit.pos)!;
            const { hit, dmg, atkRoll, defRoll } = resolveAttack(act, targetUnit, tTile);
            setLogs((l) => [
                `⚔️ ${act.name} attacks ${targetUnit.name} — Roll: ${atkRoll} vs ${defRoll} → ${hit ? `HIT (${dmg} dmg)` : "MISS"}`,
                ...l,
            ]);
            if (hit) {
                damageUnit(targetUnit.id, dmg);
            }
            setUnits((prev) => prev.map((u) => (u.id === act.id ? { ...u, ap: Math.max(0, u.ap - 1) } : u)));
            if (act.ap - 1 <= 0) nextTurn();
        }
    }

    function resetMap() {
        setTiles(genMap(radius, seed));
        setUnits(baseUnits());
        setRound(1);
        startRound();
        setLogs(["🔄 Map regenerated", ...logs]);
    }

    const allPositions = useMemo(() => Array.from(tiles.values()).map((t) => t.pos), [tiles]);
    const minX = Math.min(...allPositions.map((p) => axialToPixel(p, hexSize).x)) - hexSize * 2;
    const maxX = Math.max(...allPositions.map((p) => axialToPixel(p, hexSize).x)) + hexSize * 2;
    const minY = Math.min(...allPositions.map((p) => axialToPixel(p, hexSize).y)) - hexSize * 2;
    const maxY = Math.max(...allPositions.map((p) => axialToPixel(p, hexSize).y)) + hexSize * 2;

    const reachableKeys = new Set<string>(reach ? Array.from(reach.reachable.keys()) : []);

    return (
        <div style={{ width: '100%', height: '100vh', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', padding: '16px', background: '#1a1410', color: '#f5f3f0', fontFamily: 'Georgia, serif' }}>
            <div style={{ position: 'relative', borderRadius: '16px', border: '2px solid #8b7355', background: '#2d2620', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '6px 12px', background: '#d97706', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>Round {round}</span>
                    <span style={{ padding: '6px 12px', background: '#3b82f6', borderRadius: '8px', fontSize: '14px' }}>{active?.name ?? "—"}</span>
                    <span style={{ padding: '6px 12px', background: '#6b7280', borderRadius: '8px', fontSize: '14px' }}>{mode}</span>
                </div>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, padding: '8px 16px', background: '#374151', color: '#f8fafc', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                    >
                        ← Back
                    </button>
                )}
                <svg
                    style={{ width: '100%', height: '100%', display: 'block', borderRadius: '16px' }}
                    viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
                    role="img"
                >
                    {/* Roads */}
                    {Array.from(tiles.values()).map((t) => {
                        if (!t.road) return null;
                        const center = axialToPixel(t.pos, hexSize);
                        const paths: JSX.Element[] = [];
                        neighbors(t.pos).forEach((n, idx) => {
                            const nt = tiles.get(axialKey(n));
                            if (nt?.road) {
                                const p = axialToPixel(n, hexSize);
                                paths.push(
                                    <line key={idx} x1={center.x} y1={center.y} x2={p.x} y2={p.y} stroke="#8b6f47" strokeWidth={3} opacity={0.6} />
                                );
                            }
                        });
                        return <g key={`road-${axialKey(t.pos)}`}>{paths}</g>;
                    })}

                    {/* Hex tiles */}
                    {Array.from(tiles.values()).map((t) => {
                        const { x, y } = axialToPixel(t.pos, hexSize);
                        const reachable = reachableKeys.has(axialKey(t.pos));
                        const selectedHere = selectedUnit && axialEq(selectedUnit.pos, t.pos);
                        const terrainInfo = TERRAIN[t.terrain];
                        return (
                            <g key={axialKey(t.pos)} transform={`translate(${x},${y})`}>
                                <polygon
                                    points={hexPointsCache}
                                    fill={terrainInfo.color}
                                    stroke={showGrid ? "#00000040" : "transparent"}
                                    strokeWidth={1}
                                    style={{ cursor: 'pointer', opacity: reachable ? 1 : 0.7 }}
                                    onClick={() => onClickHex(t.pos)}
                                />
                                {selectedHere && (
                                    <polygon points={hexPointsCache} fill="none" stroke="#4f46e5" strokeWidth={3} />
                                )}
                                <text x={0} y={6} textAnchor="middle" fontSize={14} fill="#ffffff80">
                                    {terrainInfo.icon}
                                </text>
                            </g>
                        );
                    })}

                    {/* Units */}
                    {units.map((u) => {
                        if (u.hp <= 0) return null;
                        const { x, y } = axialToPixel(u.pos, hexSize);
                        const isActive = activeId === u.id;
                        const isSel = selected === u.id;
                        const teamColor = u.team === "Blue" ? "#60a5fa" : "#f87171";
                        return (
                            <g key={u.id} transform={`translate(${x},${y})`}>
                                <circle r={hexSize * 0.6} fill={teamColor} stroke="#1f2937" strokeWidth={3} />
                                {isActive && <circle r={hexSize * 0.7} fill="none" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />}
                                {isSel && <circle r={hexSize * 0.8} fill="none" stroke="#8b5cf6" strokeWidth={3} />}
                                <text y={-8} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#1f2937">
                                    {u.name}
                                </text>
                                <text y={6} textAnchor="middle" fontSize={10} fill="#1f2937">
                                    {u.hp}/{u.maxHp}
                                </text>
                                <text y={18} textAnchor="middle" fontSize={9} fill="#1f2937">
                                    AP:{u.ap}
                                </text>
                                <rect
                                    x={-hexSize}
                                    y={-hexSize}
                                    width={hexSize * 2}
                                    height={hexSize * 2}
                                    fill="transparent"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelected(u.id)}
                                />
                            </g>
                        );
                    })}

                    {/* LOS preview */}
                    {showLOS && selectedUnit && selectedUnit.range > 1 && (
                        <g>
                            {units
                                .filter((u) => u.team !== selectedUnit.team && u.hp > 0)
                                .map((enemy) => {
                                    const ok = losClear(tiles, units, selectedUnit.pos, enemy.pos, !!selectedUnit.flyer);
                                    const a = axialToPixel(selectedUnit.pos, hexSize);
                                    const b = axialToPixel(enemy.pos, hexSize);
                                    return (
                                        <line
                                            key={`los-${enemy.id}`}
                                            x1={a.x}
                                            y1={a.y}
                                            x2={b.x}
                                            y2={b.y}
                                            stroke={ok ? "#22c55e" : "#ef4444"}
                                            strokeDasharray="5 3"
                                            strokeWidth={2}
                                            opacity={0.7}
                                        />
                                    );
                                })}
                        </g>
                    )}
                </svg>
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto' }}>
                <div style={{ padding: '20px', background: '#2d2620', borderRadius: '12px', border: '2px solid #8b7355' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>⚔️ Battle Controls</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <button onClick={() => setMode("move")} style={{ padding: '8px 16px', background: mode === 'move' ? '#3b82f6' : '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                            📍 Move
                        </button>
                        <button onClick={() => setMode("attack")} style={{ padding: '8px 16px', background: mode === 'attack' ? '#ef4444' : '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                            ⚔️ Attack
                        </button>
                        <button onClick={() => nextTurn()} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                            ⏭️ End Turn
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <button onClick={() => setShowGrid(v => !v)} style={{ padding: '6px 12px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            Grid: {showGrid ? "ON" : "OFF"}
                        </button>
                        <button onClick={() => setShowLOS(v => !v)} style={{ padding: '6px 12px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            LOS: {showLOS ? "ON" : "OFF"}
                        </button>
                        <button onClick={resetMap} style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            🔄 Reset
                        </button>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Hex Size: {hexSize}</label>
                        <input type="range" min="20" max="48" value={hexSize} onChange={(e) => setHexSize(Number(e.target.value))} style={{ width: '100%' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Seed</label>
                            <input value={seed} onChange={(e) => setSeed(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #4b5563', background: '#1a1410', color: '#f5f3f0' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Radius</label>
                            <input type="number" value={radius} min={4} max={10} onChange={(e) => setRadius(parseInt(e.target.value || "6"))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #4b5563', background: '#1a1410', color: '#f5f3f0' }} />
                        </div>
                        <button onClick={() => { setTiles(genMap(radius, seed)); setLogs(l => ["🗺️ Terrain regenerated", ...l]); }} style={{ gridColumn: 'span 2', padding: '8px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            Regenerate Terrain
                        </button>
                    </div>
                </div>

                <div style={{ padding: '20px', background: '#2d2620', borderRadius: '12px', border: '2px solid #8b7355' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>🎯 Selected Unit</h3>
                    {selectedUnit ? (
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <strong>{selectedUnit.name}</strong>
                                <span style={{ padding: '2px 8px', background: selectedUnit.team === "Blue" ? "#3b82f6" : "#ef4444", borderRadius: '4px', fontSize: '11px' }}>
                                    {selectedUnit.team}
                                </span>
                            </div>
                            <div>📍 Position: ({selectedUnit.pos.q},{selectedUnit.pos.r})</div>
                            <div>❤️ HP: {selectedUnit.hp}/{selectedUnit.maxHp}</div>
                            <div>⚡ AP: {selectedUnit.ap}/{selectedUnit.maxAp}</div>
                            <div>🏃 Move: {selectedUnit.move} | 🎯 Range: {selectedUnit.range} | ⚡ Speed: {selectedUnit.spd}</div>
                            <div>⚔️ ATK: {selectedUnit.atk} | 🛡️ DEF: {selectedUnit.def}</div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>No unit selected</div>
                    )}
                </div>

                <div style={{ padding: '20px', background: '#2d2620', borderRadius: '12px', border: '2px solid #8b7355', maxHeight: '300px', overflow: 'auto' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>📜 Combat Log</h3>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.8' }}>
                        {logs.map((line, i) => (
                            <div key={i} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid #4b556340' }}>{line}</div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '12px', background: '#2d262080', borderRadius: '8px', fontSize: '11px', lineHeight: '1.6', color: '#d1d5db' }}>
                    <strong>Brigandine Features:</strong> Hex ZOC, terrain defense, initiative order, movement ranges<br />
                    <strong>M&M Inspired:</strong> Dice-based combat, paneled UI, toggleable grid/LOS<br />
                    <strong>World Engine:</strong> Species/archetype integration ready
                </div>
            </div>
        </div>
    );
}
