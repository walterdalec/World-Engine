import * as PIXI from "pixi.js";
// import "pixi.js/lib/environment-browser/browserAll.js"; // OLD PIXI V7 IMPORT - NOT NEEDED IN V8
import { OverworldLayer, Polyline } from "../features/world/renderers/pixi-v8";
import { TerrainAdapter, BiomeGrid } from "../features/world/renderers/TerrainAdapter";

// ====================================
// Math helpers
// ====================================

export type Vec2 = { x: number; y: number };

export const V = (x = 0, y = 0): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => V(a.x + b.x, a.y + b.y);
export const sub = (a: Vec2, b: Vec2): Vec2 => V(a.x - b.x, a.y - b.y);
export const mul = (a: Vec2, s: number): Vec2 => V(a.x * s, a.y * s);
export const len2 = (a: Vec2): number => a.x * a.x + a.y * a.y;
export const len = (a: Vec2): number => Math.sqrt(len2(a));
export const norm = (a: Vec2): Vec2 => {
  const L = len(a) || 1;
  return V(a.x / L, a.y / L);
};
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const ang = (a: Vec2): number => Math.atan2(a.y, a.x);
export const fromAng = (t: number): Vec2 => V(Math.cos(t), Math.sin(t));
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const dist = (a: Vec2, b: Vec2): number => len(sub(a, b));

// ====================================
// Types
// ====================================

export type FormationShape = "line" | "column" | "wedge";
export type SquadState = "steady" | "wavering" | "routing" | "shattered";
export type OrderType = "idle" | "move" | "charge" | "hold";

export interface SquadStats {
  atk: number;
  def: number;
  armor: number;
  speed: number;
  mass: number;
  morale: number;
  resolve: number;
}

export interface SquadDefinition {
  id: string;
  faction: "attacker" | "defender";
  members: number;
  spacing: number;
  shape: FormationShape;
  stats: SquadStats;
}

export interface Obstacle {
  kind:
  | "poly"
  | "water"
  | "hedge"
  | "wall"
  | "ford"
  | "ridge"
  | "bridge"
  | "marsh"
  | "forest"
  | "road"
  | "ruin"
  | "boulder";
  solid: boolean;
  points?: Vec2[];
}

export interface BattleMap {
  size: Vec2;
  obstacles: Obstacle[];
  attackerSpawns: Vec2[];
  defenderSpawns: Vec2[];
  objectives: Vec2[];
  weather: { rain: boolean; wind: number; mud: boolean };
}

// ====================================
// Formation Controller
// ====================================

export class FormationController {
  anchor: Vec2;
  facing: number;
  velocity: Vec2 = V(0, 0);
  cohesion = 1;
  stamina = 1;
  state: SquadState = "steady";
  order: { type: OrderType; target?: Vec2 } = { type: "idle" };
  path: Vec2[] = [];
  pathIndex = 0;
  ui?: SquadGfx;

  constructor(public id: string, public def: SquadDefinition, pos: Vec2, dir: number) {
    this.anchor = V(pos.x, pos.y);
    this.facing = dir;
  }
}

// ====================================
// Navigation helpers
// ====================================

export class NavService {
  constructor(private map: BattleMap) { }

  private rayBlocked(a: Vec2, b: Vec2) {
    for (const o of this.map.obstacles) {
      if (!o.solid || !o.points) continue;
      if (segmentIntersectsPoly(a, b, o.points)) return true;
    }
    return false;
  }

  pathfind(a: Vec2, b: Vec2) {
    if (!this.rayBlocked(a, b)) return [b];

    const candidates: Vec2[] = [];
    for (const o of this.map.obstacles) {
      if ((o.kind === "ford" || o.kind === "bridge") && o.points) candidates.push(...o.points);
      if (o.kind === "road" && o.points) {
        const pts = o.points;
        for (let i = 0; i < pts.length; i += 2) candidates.push(pts[i]);
        candidates.push(pts[pts.length - 1]);
      }
    }

    const laneWeight = (p: Vec2) =>
      this.map.obstacles.some(o => o.kind === "road" && o.points && pointNearPolyline(p, o.points, 20))
        ? 0.85
        : 1;

    let best: { path: Vec2[]; cost: number } | null = null;

    for (const p of candidates) {
      if (!this.rayBlocked(a, p) && !this.rayBlocked(p, b)) {
        const cost = (dist(a, p) + dist(p, b)) * laneWeight(p);
        if (!best || cost < best.cost) best = { path: [p, b], cost };
      }
    }
    if (best) return best.path;

    for (const p of candidates) {
      for (const q of candidates) {
        if (!this.rayBlocked(a, p) && !this.rayBlocked(p, q) && !this.rayBlocked(q, b)) {
          const cost = (dist(a, p) + dist(p, q) + dist(q, b)) * ((laneWeight(p) + laneWeight(q)) * 0.5);
          if (!best || cost < best.cost) best = { path: [p, q, b], cost };
        }
      }
    }

    return best ? best.path : [b];
  }
}

export class Steering {
  constructor(private map: BattleMap) {}

  private onRoad(p: Vec2) {
    return this.map.obstacles.some(
      o => o.kind === "road" && o.points && pointNearPolyline(p, o.points, 12)
    );
  }

  private inMarsh(p: Vec2) {
    return this.map.obstacles.some(o => o.kind === "marsh" && o.points && pointInPolygon(p, o.points));
  }

  private obstacleAvoidance(s: FormationController): Vec2 {
    const look = 40 + s.def.spacing;
    const ahead = add(s.anchor, mul(fromAng(s.facing), look));
    let push = V(0, 0);
    for (const o of this.map.obstacles) {
      if (!o.solid || !o.points) continue;
      if (segmentIntersectsPoly(s.anchor, ahead, o.points)) {
        for (let i = 0; i < o.points.length; i++) {
          const a = o.points[i];
          const b = o.points[(i + 1) % o.points.length];
          if (segmentsIntersect(s.anchor, ahead, a, b)) {
            const edge = sub(b, a);
            const n = norm(V(-edge.y, edge.x));
            push = add(push, mul(n, 20));
          }
        }
      }
    }
    return push;
  }

  speed(s: FormationController) {
    const base = s.def.stats.speed;
    const tired = 0.6 + 0.4 * s.stamina;
    const rattled = s.state === "wavering" ? 0.85 : 1;
    const road = this.onRoad(s.anchor) ? 1.12 : 1;
    const marsh = this.inMarsh(s.anchor) ? 0.75 : 1;
    return base * tired * rattled * road * marsh;
  }

  desired(s: FormationController) {
    if (s.state === "routing") return mul(fromAng(s.facing), this.speed(s) * 1.2);

    const v = this.speed(s);
    const follow = () => {
      const p = s.path[s.pathIndex];
      if (!p) return V(0, 0);
      const to = sub(p, s.anchor);
      if (len(to) < 14) {
        s.pathIndex++;
        return V(0, 0);
      }
      return mul(norm(to), v);
    };

    let base = V(0, 0);
    if (s.path[s.pathIndex]) base = follow();
    else if (s.order.target) {
      const to = sub(s.order.target, s.anchor);
      if (len(to) >= 8) base = mul(norm(to), v);
    }

    const avoid = this.obstacleAvoidance(s);
    return add(base, avoid);
  }
}

// ====================================
// Combat + Morale (compact)
// ====================================

export class Morale {
  test(s: FormationController, shock: number) {
    if (s.state === "routing" || s.state === "shattered") return;
    const base = 50 - s.def.stats.morale;
    const roll = Math.random() * 100;
    if (roll < base + shock) {
      s.state = s.state === "steady" ? "wavering" : s.state === "wavering" ? "routing" : "shattered";
    }
  }
}

export class Contact {
  resolve(a: FormationController, b: FormationController) {
    const d = dist(a.anchor, b.anchor);
    const front = (a.def.spacing + b.def.spacing) * 1.4 + 20;
    if (d > front) return false;

    const dirAB = norm(sub(b.anchor, a.anchor));
    const dirBA = norm(sub(a.anchor, b.anchor));

    const aFront = dot(fromAng(a.facing), dirAB) > 0.5;
    const bFront = dot(fromAng(b.facing), dirBA) > 0.5;

    const aMom = dot(a.velocity, fromAng(a.facing)) * a.def.stats.mass;
    const bMom = dot(b.velocity, fromAng(b.facing)) * b.def.stats.mass;

    const aShock = (bMom - aMom) * 0.02 + (bFront ? 8 : 0);
    const bShock = (aMom - bMom) * 0.02 + (aFront ? 8 : 0);

    a.cohesion = clamp(a.cohesion - clamp((bShock * 0.01), 0, 0.08), 0, 1);
    b.cohesion = clamp(b.cohesion - clamp((aShock * 0.01), 0, 0.08), 0, 1);

    return { aShock, bShock, aFront, bFront };
  }
}

// ====================================
// Camera helper
// ====================================

class Camera {
  private position = V(0, 0);
  private zoom = 1;

  constructor(private world: PIXI.Container, private viewport: Vec2) {
    this.apply();
  }

  screenToWorld(point: Vec2): Vec2 {
    return V((point.x - this.position.x) / this.zoom, (point.y - this.position.y) / this.zoom);
  }

  pan(worldDelta: Vec2) {
    this.position = add(this.position, mul(worldDelta, this.zoom));
    this.apply();
  }

  setZoom(next: number, focus: Vec2) {
    const clamped = clamp(next, 0.5, 1.8);
    const before = this.screenToWorld(focus);
    this.zoom = clamped;
    const after = this.screenToWorld(focus);
    const offset = sub(after, before);
    this.position = add(this.position, mul(offset, this.zoom));
    this.apply();
  }

  private apply() {
    this.world.scale.set(this.zoom);
    this.world.position.set(this.position.x, this.position.y);
  }

  centerOn(point: Vec2) {
    const half = V(this.viewport.x / 2, this.viewport.y / 2);
    this.position = sub(half, mul(point, this.zoom));
    this.apply();
  }
}

// ====================================
// Engine & context
// ====================================

export interface Ctx {
  map: BattleMap;
  nav: NavService;
  steer: Steering;
  morale: Morale;
  contact: Contact;
  squads: FormationController[];
  app: PIXI.Application;
  time: number;
  events: any[];
  world: PIXI.Container;
}

export class Engine {
  readonly fixed = 1 / 60;
  acc = 0;
  selection = new Set<FormationController>();
  hud!: HUD;
  objectiveMarker!: ObjectiveMarker;

  constructor(
    map: BattleMap,
    app: PIXI.Application,
    world: PIXI.Container
  ) {
    this.ctx = {
      map,
      nav: new NavService(map),
      steer: new Steering(map),
      morale: new Morale(),
      contact: new Contact(),
      squads: [],
      app,
      time: 0,
      events: [],
      world
    };
  }

  ctx: Ctx;

  add(s: FormationController) {
    this.ctx.squads.push(s);
    s.ui = new SquadGfx(this.ctx.world, s);
  }

  issue(s: FormationController, target: Vec2, type: OrderType) {
    s.order = { type, target };
    s.path = this.ctx.nav.pathfind(s.anchor, target);
    s.pathIndex = 0;
  }

  issueMany(target: Vec2, type: OrderType) {
    const sel = Array.from(this.selection);
    if (!sel.length) return;
    const spread = 24;
    sel.forEach((s, i) => {
      const off = V(((i % 4) - 1.5) * spread, (Math.floor(i / 4)) * spread);
      const dir = norm(sub(target, s.anchor));
      const right = V(-dir.y, dir.x);
      const tgt = add(target, add(mul(dir, off.y), mul(right, off.x)));
      this.issue(s, tgt, type);
    });
  }

  holdSelection() {
    this.selection.forEach(s => {
      s.order = { type: "hold" };
      s.path.length = 0;
    });
  }

  update(dt: number) {
    this.acc += dt;
    while (this.acc >= this.fixed) {
      this.step(this.fixed);
      this.acc -= this.fixed;
    }
    for (const s of this.ctx.squads) s.ui?.draw();
    this.hud?.draw();
    this.objectiveMarker?.draw(this.hud?.capture ?? 0);
  }

  private step(dt: number) {
    this.ctx.time += dt;
    const S = this.ctx.squads;

    const margin = 32;
    const maxX = this.ctx.map.size.x - margin;
    const maxY = this.ctx.map.size.y - margin;

    for (const s of S) {
      const desired = this.ctx.steer.desired(s);
      const diff = sub(desired, s.velocity);
      s.velocity = add(s.velocity, mul(diff, clamp(6 * dt, 0, 1)));
      if (len2(s.velocity) > 1) {
        s.facing = lerpAngle(s.facing, ang(s.velocity), 0.12);
      }
      s.anchor = add(s.anchor, mul(s.velocity, dt));
      s.anchor.x = clamp(s.anchor.x, margin, maxX);
      s.anchor.y = clamp(s.anchor.y, margin, maxY);
      for (const o of this.ctx.map.obstacles) {
        if (!o.solid || !o.points) continue;
        if (pointInPolygon(s.anchor, o.points)) {
          const push = norm(mul(s.velocity, -1));
          s.anchor = add(s.anchor, mul(push, 6));
          s.velocity = V(0, 0);
        }
      }
      s.stamina = clamp(
        s.stamina - (len(s.velocity) / (s.def.stats.speed + 1e-3)) * 0.08 * dt,
        0,
        1
      );
      s.cohesion = clamp(s.cohesion + 0.05 * dt, 0, 1);
    }

    for (let i = 0; i < S.length; i++) {
      for (let j = i + 1; j < S.length; j++) {
        const A = S[i];
        const B = S[j];
        if (A.def.faction === B.def.faction) continue;
        const res = this.ctx.contact.resolve(A, B);
        if (res) {
          A.velocity = mul(A.velocity, 0.2);
          B.velocity = mul(B.velocity, 0.2);
          const flankA = !res.aFront;
          const flankB = !res.bFront;
          this.ctx.morale.test(
            A,
            (res.bShock > 10 ? 15 : 0) + (flankA ? 10 : 0) + (1 - A.cohesion) * 10
          );
          this.ctx.morale.test(
            B,
            (res.aShock > 10 ? 15 : 0) + (flankB ? 10 : 0) + (1 - B.cohesion) * 10
          );
        }
      }
    }

    this.checkObjectiveVictory();
  }

  private checkObjectiveVictory() {
    const obj = this.ctx.map.objectives[0];
    const r = 90;
    const attackers = this.ctx.squads.filter(
      s => s.def.faction === "attacker" && dist(s.anchor, obj) < r && s.state !== "shattered"
    );
    const defenders = this.ctx.squads.filter(
      s => s.def.faction === "defender" && dist(s.anchor, obj) < r && s.state !== "shattered"
    );

    const hud = this.hud;
    if (!hud) return;

    if (defenders.length === 0 && attackers.length > 0) {
      hud.capture = clamp((hud.capture ?? 0) + 0.4, 0, 100);
      if (hud.capture >= 100) hud.winLose = "Attacker Captured!";
    } else if (attackers.length > 0) {
      hud.capture = clamp((hud.capture ?? 0) - 0.2, 0, 100);
    }
  }
}

function lerpAngle(a: number, b: number, t: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
}

// ====================================
// Graphics & HUD
// ====================================

class SquadGfx {
  readonly root = new PIXI.Container();
  private readonly body = new PIXI.Graphics();
  private readonly banner = new PIXI.Graphics();
  private readonly label = new PIXI.Text({
    text: "",
    style: new PIXI.TextStyle({
      fontSize: 12,
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 2 }
    })
  });

  constructor(private parent: PIXI.Container, private squad: FormationController) {
    this.label.anchor.set(0.5, 2);
    this.root.addChild(this.body);
    this.root.addChild(this.banner);
    this.root.addChild(this.label);
    this.parent.addChild(this.root);
  }

  draw() {
    const s = this.squad;
    this.root.position.set(s.anchor.x, s.anchor.y);
    this.root.rotation = s.facing;
    const color = s.def.faction === "attacker" ? 0xff5555 : 0x55aaff;
    const stateCol =
      s.state === "steady"
        ? 0x00ff88
        : s.state === "wavering"
          ? 0xffd966
          : s.state === "routing"
            ? 0xff6666
            : 0x777777;

    this.body.clear();
    this.body.lineStyle(2, color, 1);
    this.body.beginFill(color, 0.18);
    this.body.moveTo(22, 0);
    this.body.lineTo(-22, -14);
    this.body.lineTo(-22, 14);
    this.body.closePath();
    this.body.endFill();

    this.banner.clear();
    this.banner.beginFill(0x000000, 0.5).drawRect(-22, -38, 44, 4).endFill();
    this.banner.beginFill(stateCol).drawRect(-22, -38, 44 * moraleRatio(s.state), 4).endFill();
    this.banner.beginFill(0x000000, 0.5).drawRect(-22, -30, 44, 3).endFill();
    this.banner.beginFill(0x33ffee).drawRect(-22, -30, 44 * s.cohesion, 3).endFill();

    this.label.text = s.id;
  }
}

function moraleRatio(st: SquadState) {
  return st === "steady" ? 1 : st === "wavering" ? 0.6 : st === "routing" ? 0.25 : 0.1;
}

class ObjectiveMarker {
  private readonly ring = new PIXI.Graphics();

  constructor(parent: PIXI.Container, private position: Vec2, private radius: number) {
    parent.addChild(this.ring);
  }

  draw(progress: number) {
    this.ring.clear();
    this.ring.lineStyle(6, 0xffdd55, 0.7);
    this.ring.drawCircle(this.position.x, this.position.y, this.radius);
    if (progress > 0) {
      this.ring.lineStyle(10, 0xff9955, 0.9);
      const start = -Math.PI / 2;
      const end = start + (Math.PI * 2 * progress) / 100;
      this.ring.arc(this.position.x, this.position.y, this.radius + 4, start, end);
    }
  }
}

class HUD {
  readonly ui = new PIXI.Container();
  readonly text = new PIXI.Text({
    text: "",
    style: new PIXI.TextStyle({ fontSize: 14, fill: 0xffffff })
  });
  readonly help = new PIXI.Text({
    text: "",
    style: new PIXI.TextStyle({ fontSize: 12, fill: 0xbbbbbb })
  });
  capture = 0;
  winLose: string | undefined;

  constructor(private app: PIXI.Application, private engine: Engine) {
    this.ui.position.set(16, 16);
    this.ui.addChild(this.text);
    this.help.position.set(16, this.app.renderer.height - 64);
    this.ui.addChild(this.help);
    this.app.stage.addChild(this.ui);
    this.ui.eventMode = "none";
  }

  draw() {
    const selected = Array.from(this.engine.selection)
      .map(s => s.id)
      .join(", ") || "None";
    this.text.text = `Selected: ${selected}   Capture: ${this.capture.toFixed(0)}% ${this.winLose ? ` | ${this.winLose}` : ""
      }`;
    this.help.text =
      "Left-click select • Drag: box select • Right-click move • Shift+Right-click charge • H hold • 1-4 quick select";
  }
}

// ====================================
// Map helpers
// ====================================

export function buildGreentide(width = 1280, height = 720): BattleMap {
  const size = V(width, height);
  const obstacles: Obstacle[] = [];
  const riverY = height * 0.55;
  const riverW = 110;

  const river = [
    V(80, riverY - riverW / 2),
    V(width - 80, riverY - riverW / 2),
    V(width - 80, riverY + riverW / 2),
    V(80, riverY + riverW / 2)
  ];
  obstacles.push({ kind: "water", solid: false, points: river });

  const marshSouth = [
    V(width * 0.25, riverY + 40),
    V(width * 0.33, riverY + 20),
    V(width * 0.30, riverY + 80),
    V(width * 0.22, riverY + 95)
  ];
  const marshMid = [
    V(width * 0.58, riverY + 15),
    V(width * 0.7, riverY + 40),
    V(width * 0.68, riverY + 95),
    V(width * 0.56, riverY + 78)
  ];
  obstacles.push({ kind: "marsh", solid: false, points: marshSouth });
  obstacles.push({ kind: "marsh", solid: false, points: marshMid });

  const ford1 = [V(width * 0.35, riverY - riverW / 2), V(width * 0.35, riverY + riverW / 2)];
  const ford2 = [V(width * 0.62, riverY - riverW / 2), V(width * 0.62, riverY + riverW / 2)];
  obstacles.push({ kind: "ford", solid: false, points: ford1 });
  obstacles.push({ kind: "ford", solid: false, points: ford2 });
  const bridge = [V(width * 0.78, riverY - riverW / 2), V(width * 0.78, riverY + riverW / 2)];
  obstacles.push({ kind: "bridge", solid: false, points: bridge });

  const hedge = (a: Vec2, b: Vec2) =>
    obstacles.push({ kind: "hedge", solid: true, points: [a, b] });
  hedge(V(180, riverY - 150), V(430, riverY - 140));
  hedge(V(520, riverY - 170), V(760, riverY - 150));
  hedge(V(260, riverY + 150), V(520, riverY + 135));
  hedge(V(720, riverY + 170), V(980, riverY + 150));

  const forestNorth = [
    V(150, riverY - 260),
    V(260, riverY - 270),
    V(230, riverY - 190),
    V(140, riverY - 200)
  ];
  const forestEast = [
    V(900, riverY - 280),
    V(1010, riverY - 300),
    V(1000, riverY - 210),
    V(890, riverY - 210)
  ];
  obstacles.push({ kind: "forest", solid: false, points: forestNorth });
  obstacles.push({ kind: "forest", solid: false, points: forestEast });

  const wall = [V(width * 0.7, riverY - 240), V(width * 0.9, riverY - 240)];
  obstacles.push({ kind: "wall", solid: true, points: wall });
  const ruin = rect(width * 0.86, riverY - 210, 90, 60);
  obstacles.push({ kind: "ruin", solid: true, points: ruin });

  const roadPoints = [
    V(100, height - 100),
    V(220, height - 180),
    V(width * 0.35, riverY),
    V(width * 0.55, riverY - 200),
    V(width * 0.78, riverY - 260)
  ];
  obstacles.push({ kind: "road", solid: false, points: roadPoints });

  const ridge = [V(100, riverY - 270), V(width - 100, riverY - 310)];
  obstacles.push({ kind: "ridge", solid: false, points: ridge });

  const hamlet = rect(width * 0.22, riverY + 210, 120, 60);
  const boulder = rect(width * 0.55, riverY - 330, 50, 40);
  obstacles.push({ kind: "poly", solid: true, points: hamlet });
  obstacles.push({ kind: "boulder", solid: true, points: boulder });

  const hamletEast = rect(width * 0.82, riverY + 230, 160, 80);
  obstacles.push({ kind: "poly", solid: true, points: hamletEast });

  return {
    size,
    obstacles,
    attackerSpawns: [
      V(120, height - 120),
      V(160, height - 200),
      V(220, height - 160),
      V(260, height - 140)
    ],
    defenderSpawns: [V(width - 180, 120), V(width - 260, 160), V(width - 220, 220)],
    objectives: [V(width * 0.78, riverY - 260)],
    weather: { rain: false, wind: 0, mud: false }
  };
}

function rect(cx: number, cy: number, w: number, h: number): Vec2[] {
  return [
    V(cx - w / 2, cy - h / 2),
    V(cx + w / 2, cy - h / 2),
    V(cx + w / 2, cy + h / 2),
    V(cx - w / 2, cy + h / 2)
  ];
}

// ====================================
// Rendering helpers
// ====================================

async function createTerrainLayer(app: PIXI.Application, map: BattleMap) {
  const tileSize = 8;
  const tilesX = Math.ceil(map.size.x / tileSize);
  const tilesY = Math.ceil(map.size.y / tileSize);
  const chunkSizeTiles = Math.max(tilesX, tilesY);

  const atlas = createBattleAtlas(tileSize);
  const layer = new OverworldLayer({
    tileSize,
    chunkSizeTiles,
    atlas,
    atlasGrid: { cols: 8, rows: 8 },
    ditherStrength: 0.12
  });

  const adapter = new TerrainAdapter({
    tileSize,
    chunkSizeTiles
  });

  const biomeGrid = rasterizeBattleMap(map, tileSize);
  const chunk = adapter.convertToChunk(biomeGrid, 0, 0);
  const roads = collectRoadPolylines(map);
  if (roads.length) chunk.roads = roads;
  layer.upsertChunk(chunk);

  return {
    layer,
    cleanup: () => layer.destroy({ children: true })
  };
}

function drawObstacleOverlay(container: PIXI.Container, map: BattleMap) {
  const g = new PIXI.Graphics();
  g.eventMode = "none";
  container.addChild(g);

  const drawLine = (points: Vec2[], width: number, color: number, alpha = 1) => {
    if (!points.length) return;
    g.lineStyle(width, color, alpha);
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
  };

  for (const o of map.obstacles) {
    if (!o.points || !o.points.length) continue;
    switch (o.kind) {
      case "hedge":
        drawLine(o.points, 5, 0x25532a, 0.75);
        break;
      case "wall":
        drawLine(o.points, 6, 0x8a5a2f, 0.95);
        break;
      case "ridge":
        drawLine(o.points, 4, 0xdac27a, 0.85);
        break;
      case "ford":
        drawLine(o.points, 4, 0xbde3ff, 0.6);
        break;
      case "bridge":
        drawLine(o.points, 8, 0x9a7b53, 1);
        break;
      default:
        break;
    }
  }

  for (const p of map.objectives) {
    g.beginFill(0xffdd55, 0.95).drawCircle(p.x, p.y, 10).endFill();
  }

  return g;
}

function createBattleAtlas(tileSize: number): PIXI.Texture {
  const gridSize = 8;
  const size = tileSize * gridSize;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const baseColors = [
    "#1a4d7a", "#0d2a4d", "#c2b280", "#f4e3b5", // ocean, deep-ocean, shore, beach
    "#7fb069", "#5d9c59", "#2d5016", "#1e3810", // plains, grass, forest, dense-forest
    "#8b7355", "#696969", "#e8f4f8", "#a9c0c9", // hills, mountains, snow, tundra
    "#d4a76a", "#4a5d53", "#228b22", "#5c4033"  // desert, swamp, jungle, wasteland
  ];

  for (let i = 0; i < baseColors.length; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    ctx.fillStyle = baseColors[i];
    ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
  }

  const transitions = [
    { from: "#0d2a4d", to: "#1a4d7a", slot: 16 },
    { from: "#1a4d7a", to: "#c2b280", slot: 17 },
    { from: "#c2b280", to: "#f4e3b5", slot: 18 },
    { from: "#f4e3b5", to: "#7fb069", slot: 19 },
    { from: "#7fb069", to: "#5d9c59", slot: 20 },
    { from: "#5d9c59", to: "#2d5016", slot: 21 },
    { from: "#2d5016", to: "#1e3810", slot: 22 },
    { from: "#7fb069", to: "#8b7355", slot: 23 },
    { from: "#8b7355", to: "#696969", slot: 24 },
    { from: "#696969", to: "#e8f4f8", slot: 25 },
    { from: "#2d5016", to: "#8b7355", slot: 26 },
    { from: "#5d9c59", to: "#8b7355", slot: 27 }
  ];

  for (const trans of transitions) {
    const row = Math.floor(trans.slot / gridSize);
    const col = trans.slot % gridSize;
    const x = col * tileSize;
    const y = row * tileSize;
    const gradient = ctx.createLinearGradient(x, y, x + tileSize, y);
    gradient.addColorStop(0, trans.from);
    gradient.addColorStop(1, trans.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, tileSize, tileSize);
  }

  return PIXI.Texture.from(canvas);
}

function rasterizeBattleMap(map: BattleMap, tileSize: number): BiomeGrid {
  const widthTiles = Math.ceil(map.size.x / tileSize);
  const heightTiles = Math.ceil(map.size.y / tileSize);
  const size = widthTiles * heightTiles;
  const biomes = new Array<string>(size).fill("plains");
  const elevation = new Array<number>(size).fill(0.5);
  const priorities = new Array<number>(size).fill(0);

  const assign = (index: number, biome: string, priority: number, elev?: number) => {
    if (priority >= priorities[index]) {
      priorities[index] = priority;
      biomes[index] = biome;
      if (elev !== undefined) elevation[index] = elev;
    }
  };

  for (let y = 0; y < heightTiles; y++) {
    for (let x = 0; x < widthTiles; x++) {
      const idx = y * widthTiles + x;
      const sample = V((x + 0.5) * tileSize, (y + 0.5) * tileSize);

      for (const o of map.obstacles) {
        if (!o.points || !o.points.length) continue;
        switch (o.kind) {
          case "water":
            if (pointInPolygon(sample, o.points)) assign(idx, "ocean", 5, 0.1);
            break;
          case "marsh":
            if (pointInPolygon(sample, o.points)) assign(idx, "swamp", 4, 0.2);
            break;
          case "forest":
            if (pointInPolygon(sample, o.points)) assign(idx, "forest", 3, 0.45);
            break;
          case "boulder":
            if (pointInPolygon(sample, o.points)) assign(idx, "hills", 3, 0.6);
            break;
          case "poly":
            if (pointInPolygon(sample, o.points)) assign(idx, "grass", 2, 0.5);
            break;
          case "hedge":
          case "wall":
          case "ridge": {
            const d = distanceToPolyline(o.points, sample);
            if (d <= tileSize) assign(idx, "hills", 2, 0.58);
            break;
          }
          default:
            break;
        }
      }
    }
  }

  return { width: widthTiles, height: heightTiles, biomes, elevation };
}

function collectRoadPolylines(map: BattleMap): Polyline[] {
  const polylines: Polyline[] = [];
  for (const o of map.obstacles) {
    if (!o.points || !o.points.length) continue;
    if (o.kind === "road" || o.kind === "bridge") {
      const points = new Float32Array(o.points.flatMap(p => [p.x, p.y]));
      polylines.push({
        points,
        baseWidth: o.kind === "bridge" ? 18 : 14,
        tint: o.kind === "bridge" ? 0xb38857 : 0x9a7b53
      });
    }
  }
  return polylines;
}

function distanceToPolyline(points: Vec2[], p: Vec2): number {
  if (points.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const d = distanceToSegment(p, points[i], points[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

const flat = (pts: Vec2[]) => pts.flatMap(p => [p.x, p.y]);

// ====================================
// Input system: selection, camera, orders
// ====================================

class InputSystem {
  private dragging = false;
  private dragStart: Vec2 = V();
  private readonly dragBox = new PIXI.Graphics();
  private draggingCamera = false;
  private cameraLast: Vec2 = V();
  private readonly pointerDownHandler = (e: PIXI.FederatedPointerEvent) => this.onPointerDown(e);
  private readonly pointerMoveHandler = (e: PIXI.FederatedPointerEvent) => this.onPointerMove(e);
  private readonly pointerUpHandler = (e: PIXI.FederatedPointerEvent) => this.onPointerUp(e);
  private readonly pointerUpOutsideHandler = () => this.onPointerUpOutside();
  private readonly contextMenuHandler = (ev: Event) => ev.preventDefault();
  private readonly wheelHandler = (ev: WheelEvent) => this.onWheel(ev);
  private readonly keyHandler = (ev: KeyboardEvent) => this.onKey(ev);

  constructor(
    private engine: Engine,
    private app: PIXI.Application,
    private camera: Camera,
    private overlay: PIXI.Container
  ) {
    this.overlay.addChild(this.dragBox);
    this.bind();
  }

  private bind() {
    const stage = this.app.stage;
    stage.eventMode = "static";
    stage.hitArea = new PIXI.Rectangle(0, 0, this.app.renderer.width, this.app.renderer.height);

    stage.on("pointerdown", this.pointerDownHandler);
    stage.on("pointermove", this.pointerMoveHandler);
    stage.on("pointerup", this.pointerUpHandler);
    stage.on("pointerupoutside", this.pointerUpOutsideHandler);

    this.app.canvas.addEventListener("contextmenu", this.contextMenuHandler);
    this.app.canvas.addEventListener("wheel", this.wheelHandler, { passive: false });

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.keyHandler);
    }
  }

  dispose() {
    const stage = this.app.stage;
    stage.off("pointerdown", this.pointerDownHandler);
    stage.off("pointermove", this.pointerMoveHandler);
    stage.off("pointerup", this.pointerUpHandler);
    stage.off("pointerupoutside", this.pointerUpOutsideHandler);

    this.app.canvas.removeEventListener("contextmenu", this.contextMenuHandler);
    this.app.canvas.removeEventListener("wheel", this.wheelHandler);

    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.keyHandler);
    }
  }

  private getZoom() {
    return this.engine.ctx.world.scale.x;
  }

  private onPointerDown(e: PIXI.FederatedPointerEvent) {
    const pos = V(e.global.x, e.global.y);
    if (e.button === 0) {
      this.dragging = true;
      this.dragStart = pos;
    } else if (e.button === 1) {
      this.draggingCamera = true;
      this.cameraLast = pos;
    }
  }

  private onPointerMove(e: PIXI.FederatedPointerEvent) {
    const pos = V(e.global.x, e.global.y);
    if (this.dragging) {
      this.drawBox(this.dragStart, pos);
    } else if (this.draggingCamera) {
      const deltaScreen = V(pos.x - this.cameraLast.x, pos.y - this.cameraLast.y);
      this.cameraLast = pos;
      const z = this.getZoom();
      this.camera.pan(mul(deltaScreen, 1 / z));
    }
  }

  private onPointerUp(e: PIXI.FederatedPointerEvent) {
    const pos = V(e.global.x, e.global.y);
    if (e.button === 0) {
      if (this.dragging) {
        this.finishBox(this.dragStart, pos, e.shiftKey);
      } else {
        this.performClickSelection(pos, e.shiftKey);
      }
      this.dragging = false;
      this.dragBox.clear();
    } else if (e.button === 1) {
      this.draggingCamera = false;
    } else if (e.button === 2) {
      const world = this.camera.screenToWorld(pos);
      const type: OrderType = e.shiftKey ? "charge" : "move";
      this.engine.issueMany(world, type);
    }
  }

  private onPointerUpOutside() {
    this.dragging = false;
    this.draggingCamera = false;
    this.dragBox.clear();
  }

  private onWheel(ev: WheelEvent) {
    ev.preventDefault();
    const direction = ev.deltaY > 0 ? -0.1 : 0.1;
    this.camera.setZoom(this.getZoom() + direction, V(ev.offsetX, ev.offsetY));
  }

  private onKey(ev: KeyboardEvent) {
    if (ev.key.toLowerCase() === "h") {
      this.engine.holdSelection();
    }
    if (/^[1-4]$/.test(ev.key)) {
      this.quickSelect(parseInt(ev.key, 10));
    }
  }

  private performClickSelection(pos: Vec2, append: boolean) {
    const world = this.camera.screenToWorld(pos);
    const pick = this.engine.ctx.squads.find(
      s => s.def.faction === "attacker" && dist(s.anchor, world) < 40
    );
    if (!append) this.engine.selection.clear();
    if (pick) this.engine.selection.add(pick);
  }

  private drawBox(a: Vec2, b: Vec2) {
    this.dragBox.clear();
    this.dragBox.lineStyle(1, 0xffffff, 0.8);
    this.dragBox.beginFill(0xffffff, 0.08);
    this.dragBox.drawRect(
      Math.min(a.x, b.x),
      Math.min(a.y, b.y),
      Math.abs(a.x - b.x),
      Math.abs(a.y - b.y)
    );
    this.dragBox.endFill();
  }

  private finishBox(a: Vec2, b: Vec2, append: boolean) {
    const min = this.camera.screenToWorld(V(Math.min(a.x, b.x), Math.min(a.y, b.y)));
    const max = this.camera.screenToWorld(V(Math.max(a.x, b.x), Math.max(a.y, b.y)));
    const pick = this.engine.ctx.squads.filter(
      s =>
        s.def.faction === "attacker" &&
        s.anchor.x >= min.x &&
        s.anchor.x <= max.x &&
        s.anchor.y >= min.y &&
        s.anchor.y <= max.y
    );
    if (!append) this.engine.selection.clear();
    pick.forEach(p => this.engine.selection.add(p));
  }

  private quickSelect(n: number) {
    const attackers = this.engine.ctx.squads.filter(s => s.def.faction === "attacker");
    const squad = attackers[n - 1];
    if (!squad) return;
    this.engine.selection.clear();
    this.engine.selection.add(squad);
  }
}

// ====================================
// Bootstrapping
// ====================================

export async function startGreentidePlayable(
  container: HTMLElement,
  opts?: { width?: number; height?: number }
) {
  const width = opts?.width ?? 1280;
  const height = opts?.height ?? 720;
  const app = new PIXI.Application();
  await app.init({ width, height, background: 0x161a20, antialias: true });
  container.appendChild(app.canvas);

  const map = buildGreentide(width, height);
  const { layer: terrainLayer, cleanup: terrainCleanup } = await createTerrainLayer(app, map);
  app.stage.addChild(terrainLayer);

  const world = new PIXI.Container();
  world.sortableChildren = true;
  app.stage.addChild(world);

  const overlay = new PIXI.Container();
  overlay.eventMode = "none";
  app.stage.addChild(overlay);
  drawObstacleOverlay(overlay, map);

  const camera = new Camera(world, V(width, height));
  camera.centerOn(V(width / 2, height / 2));

  const engine = new Engine(map, app, world);
  const hud = new HUD(app, engine);
  engine.hud = hud;
  const objectiveMarker = new ObjectiveMarker(world, map.objectives[0], 72);
  engine.objectiveMarker = objectiveMarker;

  // Spawn squads
  const mk = (
    id: string,
    faction: "attacker" | "defender",
    members: number,
    spacing: number,
    shape: FormationShape,
    stats: SquadStats,
    spawn: Vec2,
    facing: number
  ) =>
    new FormationController(id, { id, faction, members, spacing, shape, stats }, spawn, facing);

  const ATK: SquadStats = { atk: 60, def: 55, armor: 2, speed: 80, mass: 12, morale: 55, resolve: 40 };
  const DEF: SquadStats = { atk: 55, def: 65, armor: 3, speed: 70, mass: 14, morale: 65, resolve: 55 };
  const CAV: SquadStats = { atk: 70, def: 50, armor: 2, speed: 120, mass: 18, morale: 60, resolve: 50 };

  const attackers: FormationController[] = [
    mk("Swords A", "attacker", 12, 14, "line", ATK, map.attackerSpawns[0], 0),
    mk("Swords B", "attacker", 12, 14, "line", ATK, map.attackerSpawns[1], 0),
    mk("Spears A", "attacker", 14, 12, "line", { ...ATK, def: 60 }, map.attackerSpawns[2], 0),
    mk("Light A", "attacker", 10, 12, "column", { ...ATK, speed: 90, armor: 1 }, map.attackerSpawns[3], 0)
  ];

  const defenders: FormationController[] = [
    mk("Pikes D", "defender", 14, 12, "line", DEF, map.defenderSpawns[0], Math.PI),
    mk(
      "Cavalry D",
      "defender",
      10,
      16,
      "wedge",
      CAV,
      add(map.defenderSpawns[1], V(-120, 80)),
      Math.PI * 0.9
    ),
    mk(
      "Guard D",
      "defender",
      12,
      14,
      "line",
      { ...DEF, def: 62 },
      map.defenderSpawns[2],
      Math.PI * 0.95
    )
  ];

  [...attackers, ...defenders].forEach(s => engine.add(s));

  const objective = map.objectives[0];
  engine.issue(defenders[0], objective, "hold");
  engine.issue(defenders[2], add(objective, V(40, 20)), "hold");

  engine.selection.add(attackers[0]);
  engine.selection.add(attackers[1]);

  const input = new InputSystem(engine, app, camera, overlay);

  app.ticker.add(() => {
    const delta = app.ticker.deltaMS / 1000;
    const foes = engine.ctx.squads.filter(s => s.def.faction === "attacker");
    const cav = defenders[1];
    const fordX = width * 0.35;
    const fordY = height * 0.55;
    const nearFord = foes.find(
      f => Math.abs(f.anchor.x - fordX) < 60 && Math.abs(f.anchor.y - fordY) < 90
    );
    if (nearFord && dist(cav.anchor, nearFord.anchor) < 260) {
      engine.issue(cav, nearFord.anchor, "charge");
    }

    engine.update(delta);
  });

  return {
    app,
    engine,
    input,
    dispose() {
      input.dispose();
      terrainCleanup();
    }
  };
}

// ====================================
// Geometry utils
// ====================================

function pointNearPolyline(p: Vec2, poly: Vec2[], thickness = 10): boolean {
  if (poly.length < 2) return false;
  for (let i = 0; i < poly.length - 1; i++) {
    if (distanceToSegment(p, poly[i], poly[i + 1]) <= thickness) return true;
  }
  return false;
}

function segmentIntersectsPoly(a: Vec2, b: Vec2, poly: Vec2[]): boolean {
  for (let i = 0; i < poly.length; i++) {
    const c = poly[i];
    const d = poly[(i + 1) % poly.length];
    if (segmentsIntersect(a, b, c, d)) return true;
  }
  return false;
}

function segmentsIntersect(a: Vec2, b: Vec2, c: Vec2, d: Vec2) {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  return o1 !== o2 && o3 !== o4;
}

function orient(p: Vec2, q: Vec2, r: Vec2) {
  const v = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  return v === 0 ? 0 : v > 0 ? 1 : 2;
}

function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersect =
      (pi.y > point.y) !== (pj.y > point.y) &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / ((pj.y - pi.y) || 1e-6) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const t = clamp(dot(ap, ab) / (len2(ab) || 1), 0, 1);
  const h = sub(add(a, mul(ab, t)), p);
  return Math.sqrt(len2(h));
}
