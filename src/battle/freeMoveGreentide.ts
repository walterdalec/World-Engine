import * as PIXI from "pixi.js";

export type Faction = "attacker" | "defender";
export type FormationKind = "line" | "column" | "wedge";
export type OrderType = "hold" | "move" | "charge";

export interface Vec2 { x: number; y: number; }

type MapObstacle =
  | { kind: "river" | "swamp" | "poly"; points: Vec2[] }
  | { kind: "ford" | "bridge" | "ridge" | "wall" | "hedge"; points: Vec2[] }
  | { kind: "hamlet"; center: Vec2; radius: number }
  | { kind: "tree"; center: Vec2; radius: number };

export interface BattleMap {
  width: number;
  height: number;
  obstacles: MapObstacle[];
  objectives: Vec2[];
  attackerSpawns: Vec2[];
  defenderSpawns: Vec2[];
}

interface SquadStats {
  speed: number;
  attack: number;
  defense: number;
  morale: number;
  charge?: number;
}

export interface SquadDefinition {
  id: string;
  name: string;
  faction: Faction;
  unitCount: number;
  formation: FormationKind;
  spacing: number;
  color: number;
  bannerColor?: number;
  controllable?: boolean;
  stats: SquadStats;
}

interface SquadSeed {
  definition: SquadDefinition;
  spawn: Vec2;
  heading?: number;
  initialOrder?: SquadOrder;
}

export interface SquadOrder {
  type: OrderType;
  target: Vec2;
}

interface FormationMember {
  sprite: PIXI.Graphics;
  offset: Vec2;
  world: Vec2;
}

interface EngineOptions {
  debug?: boolean;
  stageScale?: number;
}

interface EngineContext {
  map: BattleMap;
  app: PIXI.Application;
  squads: FormationController[];
  debug: boolean;
  terrainModifier(point: Vec2): number;
}

const BASE_BACKGROUND = 0x1f1a14;

const GREENTIDE_MAP: BattleMap = {
  width: 1280,
  height: 720,
  obstacles: [
    {
      kind: "river",
      points: [
        { x: 460, y: -40 },
        { x: 560, y: -48 },
        { x: 600, y: 60 },
        { x: 614, y: 160 },
        { x: 640, y: 280 },
        { x: 626, y: 420 },
        { x: 652, y: 580 },
        { x: 620, y: 760 },
        { x: 520, y: 768 },
        { x: 486, y: 620 },
        { x: 462, y: 460 },
        { x: 440, y: 300 },
        { x: 448, y: 160 },
        { x: 444, y: 40 }
      ]
    },
    {
      kind: "swamp",
      points: [
        { x: 300, y: 520 },
        { x: 380, y: 560 },
        { x: 360, y: 620 },
        { x: 290, y: 640 },
        { x: 250, y: 600 }
      ]
    },
    { kind: "ford", points: [{ x: 494, y: 260 }, { x: 610, y: 280 }] },
    { kind: "ford", points: [{ x: 508, y: 450 }, { x: 632, y: 470 }] },
    { kind: "hedge", points: [{ x: 760, y: 540 }, { x: 1020, y: 580 }] },
    { kind: "hedge", points: [{ x: 780, y: 560 }, { x: 820, y: 640 }] },
    { kind: "wall", points: [{ x: 900, y: 360 }, { x: 1050, y: 340 }] },
    { kind: "ridge", points: [{ x: 840, y: 180 }, { x: 1140, y: 320 }] },
    {
      kind: "poly",
      points: [
        { x: 760, y: 80 },
        { x: 940, y: 120 },
        { x: 960, y: 220 },
        { x: 780, y: 200 }
      ]
    },
    {
      kind: "hamlet",
      center: { x: 940, y: 410 },
      radius: 28
    },
    {
      kind: "hamlet",
      center: { x: 1080, y: 520 },
      radius: 32
    },
    {
      kind: "tree",
      center: { x: 860, y: 520 },
      radius: 22
    },
    {
      kind: "tree",
      center: { x: 1020, y: 260 },
      radius: 24
    }
  ],
  objectives: [
    { x: 980, y: 260 },
    { x: 1040, y: 420 }
  ],
  attackerSpawns: [
    { x: 200, y: 260 },
    { x: 260, y: 420 },
    { x: 220, y: 520 }
  ],
  defenderSpawns: [
    { x: 940, y: 260 },
    { x: 1000, y: 360 },
    { x: 960, y: 480 }
  ]
};

const GREENTIDE_ORDER_OF_BATTLE: SquadSeed[] = [
  {
    definition: {
      id: "att_swords",
      name: "Greentide Swords",
      faction: "attacker",
      unitCount: 18,
      formation: "line",
      spacing: 26,
      color: 0xcf4a3a,
      bannerColor: 0xf7ae6b,
      controllable: true,
      stats: { speed: 95, attack: 62, defense: 54, morale: 78, charge: 10 }
    },
    spawn: GREENTIDE_MAP.attackerSpawns[0],
    heading: degToRad(12)
  },
  {
    definition: {
      id: "att_spears",
      name: "River Guard",
      faction: "attacker",
      unitCount: 16,
      formation: "column",
      spacing: 24,
      color: 0xd0692d,
      bannerColor: 0xffc977,
      controllable: true,
      stats: { speed: 82, attack: 55, defense: 60, morale: 82 }
    },
    spawn: GREENTIDE_MAP.attackerSpawns[1],
    heading: degToRad(20)
  },
  {
    definition: {
      id: "att_cav",
      name: "Bracken Riders",
      faction: "attacker",
      unitCount: 12,
      formation: "wedge",
      spacing: 32,
      color: 0xb5422f,
      bannerColor: 0xf5d17d,
      controllable: true,
      stats: { speed: 158, attack: 72, defense: 48, morale: 74, charge: 34 }
    },
    spawn: GREENTIDE_MAP.attackerSpawns[2],
    heading: degToRad(28)
  },
  {
    definition: {
      id: "def_line",
      name: "Ridge Guard",
      faction: "defender",
      unitCount: 20,
      formation: "line",
      spacing: 26,
      color: 0x4a78c8,
      bannerColor: 0x9ad4ff,
      stats: { speed: 70, attack: 64, defense: 66, morale: 88 }
    },
    spawn: GREENTIDE_MAP.defenderSpawns[0],
    heading: degToRad(190),
    initialOrder: { type: "hold", target: GREENTIDE_MAP.defenderSpawns[0] }
  },
  {
    definition: {
      id: "def_reserve",
      name: "Saintholm Axes",
      faction: "defender",
      unitCount: 14,
      formation: "column",
      spacing: 24,
      color: 0x3c5d9f,
      bannerColor: 0xb7d5ff,
      stats: { speed: 76, attack: 58, defense: 60, morale: 76 }
    },
    spawn: GREENTIDE_MAP.defenderSpawns[1],
    heading: degToRad(190),
    initialOrder: { type: "hold", target: GREENTIDE_MAP.defenderSpawns[1] }
  },
  {
    definition: {
      id: "def_cav",
      name: "Riverwatch Lancers",
      faction: "defender",
      unitCount: 10,
      formation: "wedge",
      spacing: 30,
      color: 0x4e6fb8,
      bannerColor: 0xd5ecff,
      stats: { speed: 162, attack: 70, defense: 52, morale: 80, charge: 36 }
    },
    spawn: GREENTIDE_MAP.defenderSpawns[2],
    heading: degToRad(205),
    initialOrder: { type: "hold", target: GREENTIDE_MAP.defenderSpawns[2] }
  }
];

export class FormationController {
  readonly definition: SquadDefinition;
  readonly container: PIXI.Container;
  readonly members: FormationMember[];
  readonly anchor: Vec2;
  order: SquadOrder;
  morale: number;
  fatigue = 0;
  heading: number;
  private readonly selectionRing: PIXI.Graphics;
  private readonly primaryRing: PIXI.Graphics;
  private readonly banner: PIXI.Graphics;
  private readonly label: PIXI.Text;
  private readonly radius: number;
  private velocity: Vec2 = { x: 0, y: 0 };
  private chargeTimer = 0;
  private engaged = false;
  private readonly baseColor: number;
  private readonly highlightColor: number;

  constructor(parent: PIXI.Container, seed: SquadSeed) {
    this.definition = seed.definition;
    this.anchor = { x: seed.spawn.x, y: seed.spawn.y };
    this.heading = seed.heading ?? 0;
    this.container = new PIXI.Container();
    this.container.position.set(this.anchor.x, this.anchor.y);
    this.container.rotation = this.heading;
    this.container.sortableChildren = true;
    parent.addChild(this.container);

    this.baseColor = seed.definition.color;
    this.highlightColor = lightenColor(seed.definition.color, 0.18);

    this.members = buildFormation(seed.definition).map(offset => {
      const sprite = new PIXI.Graphics();
      sprite.beginFill(this.baseColor, 0.92);
      sprite.drawRoundedRect(-10, -8, 20, 16, 4);
      sprite.endFill();
      sprite.position.set(offset.x, offset.y);
      sprite.alpha = 0.95;
      this.container.addChild(sprite);
      return { sprite, offset, world: addVec(this.anchor, offset) };
    });

    this.banner = new PIXI.Graphics();
    this.banner.beginFill(seed.definition.bannerColor ?? lightenColor(seed.definition.color, 0.3), 1);
    this.banner.drawRect(-4, -26, 8, 26);
    this.banner.endFill();
    this.banner.position.set(0, -seed.definition.spacing * 0.5);
    this.container.addChild(this.banner);

    this.selectionRing = new PIXI.Graphics();
    this.selectionRing.lineStyle(2, 0xffffff, 0.75);
    const ringRadius = Math.max(28, Math.sqrt(seed.definition.unitCount) * seed.definition.spacing * 0.35);
    this.selectionRing.drawCircle(0, 0, ringRadius);
    this.selectionRing.visible = false;
    this.container.addChild(this.selectionRing);

    this.primaryRing = new PIXI.Graphics();
    this.primaryRing.lineStyle(3, 0xfff5b1, 0.85);
    this.primaryRing.drawCircle(0, 0, ringRadius + 4);
    this.primaryRing.visible = false;
    this.container.addChild(this.primaryRing);

    this.radius = ringRadius;

    this.label = new PIXI.Text({
      text: seed.definition.name,
      style: new PIXI.TextStyle({
        fill: 0xffffff,
        fontSize: 14,
        fontFamily: "Arial",
        stroke: { color: 0x000000, width: 3 },
        align: "center"
      })
    });
    this.label.anchor.set(0.5, 0);
    this.label.position.set(0, ringRadius + 6);
    this.container.addChild(this.label);

    this.order = seed.initialOrder ?? {
      type: "hold",
      target: { x: this.anchor.x, y: this.anchor.y }
    };
    this.morale = seed.definition.stats.morale;
  }

  get faction(): Faction {
    return this.definition.faction;
  }

  get contactRadius(): number {
    return this.radius;
  }

  setSelectionState(selected: boolean, primary: boolean) {
    this.selectionRing.visible = selected;
    this.primaryRing.visible = selected && primary;
    const tint = selected ? this.highlightColor : 0xffffff;
    for (const m of this.members) {
      m.sprite.tint = tint;
    }
    this.banner.tint = selected ? this.highlightColor : 0xffffff;
    this.label.tint = selected ? 0xfff9dc : 0xffffff;
  }

  hitTest(point: Vec2): boolean {
    return dist(point, this.anchor) <= this.radius + 10;
  }

  setOrder(order: SquadOrder) {
    this.order = { type: order.type, target: { x: order.target.x, y: order.target.y } };
    if (order.type === "charge") {
      this.chargeTimer = 3;
    }
    if (order.type === "hold") {
      this.velocity = { x: 0, y: 0 };
    }
  }

  tick(dt: number, ctx: EngineContext) {
    const terrainMod = ctx.terrainModifier(this.anchor);
    const desired = this.resolveDesiredVelocity(dt, terrainMod);
    const avoidance = this.computeAvoidance(ctx);

    this.velocity.x = lerp(this.velocity.x, desired.x + avoidance.x, clamp(dt * 4, 0, 1));
    this.velocity.y = lerp(this.velocity.y, desired.y + avoidance.y, clamp(dt * 4, 0, 1));

    const speed = length(this.velocity);
    if (speed < 1) {
      this.velocity.x *= 0.8;
      this.velocity.y *= 0.8;
    }

    this.anchor.x += this.velocity.x * dt;
    this.anchor.y += this.velocity.y * dt;

    const margin = 32;
    const maxX = ctx.map.width - margin;
    const maxY = ctx.map.height - margin;
    this.anchor.x = clamp(this.anchor.x, margin, maxX);
    this.anchor.y = clamp(this.anchor.y, margin, maxY);

    if (terrainMod < 0.6) {
      this.fatigue += dt * 3;
    } else if (this.fatigue > 0) {
      this.fatigue = Math.max(0, this.fatigue - dt * 2);
    }

    if (this.chargeTimer > 0) {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0 && this.order.type === "charge") {
        this.order = { type: "move", target: { x: this.order.target.x, y: this.order.target.y } };
      }
    }

    const headingTarget = speed > 6 ? Math.atan2(this.velocity.y, this.velocity.x) : this.heading;
    this.heading = lerpAngle(this.heading, headingTarget, clamp(dt * 6, 0, 1));

    this.updateGraphics();
    this.engaged = false;
  }

  markEngaged() {
    this.engaged = true;
  }

  applyMoraleHit(amount: number) {
    this.morale = Math.max(0, this.morale - amount);
  }

  resolveAfterCombat() {
    if (this.morale <= 0) {
      this.order = {
        type: "move",
        target: { x: this.anchor.x - Math.cos(this.heading) * 200, y: this.anchor.y - Math.sin(this.heading) * 200 }
      };
      this.morale = 5;
    }
  }

  private resolveDesiredVelocity(dt: number, terrainMod: number): Vec2 {
    const currentOrder = this.order;
    if (currentOrder.type === "hold") {
      const towardAnchor = subVec(currentOrder.target, this.anchor);
      if (length(towardAnchor) > 4) {
        return scaleVec(normalize(towardAnchor), this.definition.stats.speed * 0.3 * terrainMod);
      }
      return scaleVec(this.velocity, 0.3);
    }

    const targetDir = subVec(currentOrder.target, this.anchor);
    const distToTarget = length(targetDir);
    if (distToTarget < this.radius * 0.8) {
      this.order = { type: "hold", target: { x: this.anchor.x, y: this.anchor.y } };
      return { x: 0, y: 0 };
    }

    const speed = this.definition.stats.speed * terrainMod * this.speedModifier();
    return scaleVec(normalize(targetDir), speed);
  }

  private speedModifier(): number {
    let modifier = 1;
    if (this.order.type === "charge") {
      modifier += 0.45;
    }
    if (this.fatigue > 25) {
      modifier *= 0.75;
    }
    if (this.morale < 25) {
      modifier *= 0.7;
    }
    return modifier;
  }

  private computeAvoidance(ctx: EngineContext): Vec2 {
    const out = { x: 0, y: 0 };
    for (const other of ctx.squads) {
      if (other === this) continue;
      const offset = subVec(this.anchor, other.anchor);
      const d = Math.max(1, length(offset));
      if (d > this.radius + other.radius + 30) continue;
      const push = (this.radius + other.radius + 30 - d) / (this.radius + other.radius + 30);
      out.x += (offset.x / d) * push * 60;
      out.y += (offset.y / d) * push * 60;
    }
    return out;
  }

  private updateGraphics() {
    this.container.position.set(this.anchor.x, this.anchor.y);
    this.container.rotation = this.heading;
    for (const member of this.members) {
      member.world = rotateAndTranslate(member.offset, this.heading, this.anchor);
    }
  }

  get chargeBonus(): number {
    return this.order.type === "charge" ? this.definition.stats.charge ?? 0 : 0;
  }
}

export class BattleEngine {
  readonly app: PIXI.Application;
  readonly map: BattleMap;
  readonly options: Required<EngineOptions>;
  readonly ctx: EngineContext;
  readonly root: PIXI.Container;
  readonly ai: AIController;

  private readonly squadsInternal: FormationController[] = [];
  private readonly mapLayer: PIXI.Container;
  private readonly waypointLayer: PIXI.Container;
  private readonly squadLayer: PIXI.Container;
  private readonly overlayLayer: PIXI.Container;
  private readonly pointerMarker: PIXI.Graphics;
  private readonly selected = new Set<FormationController>();
  private primarySelection?: FormationController;
  private readonly ridgePoint = { x: 980, y: 280 };
  private readonly handleKeyDownBound: (event: KeyboardEvent) => void;

  constructor(app: PIXI.Application, map: BattleMap, options?: EngineOptions) {
    this.app = app;
    this.map = map;
    this.options = {
      debug: options?.debug ?? false,
      stageScale: options?.stageScale ?? 1
    };

    this.root = new PIXI.Container();
    this.root.sortableChildren = true;
    this.root.eventMode = "static";
    this.root.hitArea = new PIXI.Rectangle(0, 0, map.width, map.height);
    this.app.stage.addChild(this.root);

    const stageWidth = this.app.renderer.width;
    const stageHeight = this.app.renderer.height;
    const scale = this.options.stageScale;
    this.root.scale.set(scale);
    this.root.position.set(
      (stageWidth - map.width * scale) * 0.5,
      (stageHeight - map.height * scale) * 0.5
    );

    this.mapLayer = new PIXI.Container();
    this.root.addChild(this.mapLayer);
    renderMap(this.mapLayer, this.map);

    this.waypointLayer = new PIXI.Container();
    this.root.addChild(this.waypointLayer);
    drawWaypoints(this.waypointLayer, this.map);

    this.squadLayer = new PIXI.Container();
    this.squadLayer.sortableChildren = true;
    this.root.addChild(this.squadLayer);

    this.overlayLayer = new PIXI.Container();
    this.root.addChild(this.overlayLayer);

    this.pointerMarker = new PIXI.Graphics();
    this.pointerMarker.visible = false;
    this.overlayLayer.addChild(this.pointerMarker);

    this.handleKeyDownBound = (event: KeyboardEvent) => this.handleKeyDown(event);

    this.ctx = {
      map: this.map,
      app: this.app,
      squads: this.squadsInternal,
      debug: this.options.debug,
      terrainModifier: (point: Vec2) => this.getTerrainModifier(point)
    };

    this.ai = new AIController(this);

    this.registerPointerEvents();
  }

  get squads(): FormationController[] {
    return this.squadsInternal;
  }

  start() {
    for (const seed of GREENTIDE_ORDER_OF_BATTLE) {
      this.addSquad(seed);
    }
    this.selectDefaultSquad();
    this.app.ticker.add(this.onTick);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDownBound);
    }
  }

  destroy() {
    this.app.ticker.remove(this.onTick);
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDownBound);
    }
    for (const squad of this.squadsInternal) {
      squad.container.destroy({ children: true });
    }
    this.root.destroy({ children: true });
  }

  private addSquad(seed: SquadSeed) {
    const squad = new FormationController(this.squadLayer, seed);
    this.squadsInternal.push(squad);
  }

  private selectDefaultSquad() {
    const controllable = this.getControllableSquads();
    if (controllable.length) {
      this.focusSelection(controllable[0]);
    }
  }

  private getControllableSquads(): FormationController[] {
    return this.squadsInternal.filter(s => s.definition.controllable);
  }

  private registerPointerEvents() {
    this.root.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
      const local = event.getLocalPosition(this.root);
      const worldPoint = {
        x: local.x / this.options.stageScale,
        y: local.y / this.options.stageScale
      };
      const native = event.nativeEvent as MouseEvent | PointerEvent | undefined;
      const button = native?.button ?? 0;
      const additive = !!native && (native.ctrlKey || native.metaKey);

      const target = this.pickSquadAt(worldPoint);
      if (target) {
        if (!target.definition.controllable) return;
        if (additive) {
          this.toggleSelection(target);
        } else {
          this.focusSelection(target);
        }
        return;
      }

      if (!this.selected.size) return;

      if (button === 2) {
        native?.preventDefault?.();
        this.issueHoldPosition();
        return;
      }

      const isCharge = !!native && native.shiftKey;
      const type: OrderType = isCharge ? "charge" : "move";
      this.issueGroupOrder(worldPoint, type);
    });
  }

  private focusSelection(squad: FormationController) {
    if (this.selected.size === 1 && this.selected.has(squad)) {
      this.primarySelection = squad;
      this.updateSelectionVisuals();
      return;
    }
    this.clearSelection();
    this.selected.add(squad);
    this.primarySelection = squad;
    this.updateSelectionVisuals();
  }

  private toggleSelection(squad: FormationController) {
    if (this.selected.has(squad)) {
      this.selected.delete(squad);
      squad.setSelectionState(false, false);
      if (this.primarySelection === squad) {
        this.primarySelection = this.selected.values().next().value;
      }
    } else {
      this.selected.add(squad);
      if (!this.primarySelection) {
        this.primarySelection = squad;
      }
    }
    if (!this.selected.size) {
      this.primarySelection = undefined;
    }
    this.updateSelectionVisuals();
  }

  private clearSelection() {
    this.selected.forEach(squad => {
      squad.setSelectionState(false, false);
    });
    this.selected.clear();
    this.primarySelection = undefined;
  }

  private updateSelectionVisuals() {
    for (const squad of this.squadsInternal) {
      if (!this.selected.has(squad)) {
        squad.setSelectionState(false, false);
      }
    }
    this.selected.forEach(squad => {
      squad.setSelectionState(true, squad === this.primarySelection);
    });
  }

  private pickSquadAt(point: Vec2): FormationController | undefined {
    for (let i = this.squadsInternal.length - 1; i >= 0; i -= 1) {
      const squad = this.squadsInternal[i];
      if (squad.hitTest(point)) {
        return squad;
      }
    }
    return undefined;
  }

  private readonly onTick = (ticker: PIXI.Ticker) => {
    const dt = ticker.deltaMS / 1000;
    for (const squad of this.squadsInternal) {
      squad.tick(dt, this.ctx);
    }
    this.resolveContacts(dt);
    this.ai.update(dt);
  };

  private selectAllControllable() {
    const controllable = this.getControllableSquads();
    if (!controllable.length) return;
    this.clearSelection();
    for (const squad of controllable) {
      this.selected.add(squad);
    }
    this.primarySelection = controllable[0];
    this.updateSelectionVisuals();
  }

  private cycleSelection(direction: number) {
    const controllable = this.getControllableSquads();
    if (!controllable.length) return;
    const currentIndex = this.primarySelection ? controllable.indexOf(this.primarySelection) : -1;
    const nextIndex = (currentIndex + direction + controllable.length) % controllable.length;
    this.focusSelection(controllable[nextIndex]);
  }

  private issueGroupOrder(destination: Vec2, type: OrderType) {
    if (!this.selected.size) return;
    const squads = Array.from(this.selected);
    const center = squads.reduce<Vec2>(
      (acc, squad) => ({ x: acc.x + squad.anchor.x, y: acc.y + squad.anchor.y }),
      { x: 0, y: 0 }
    );
    center.x /= squads.length;
    center.y /= squads.length;

    const factor = type === "charge" ? 0.4 : 0.6;
    squads.forEach((squad, index) => {
      const offset = subVec(squad.anchor, center);
      const target = {
        x: destination.x + offset.x * factor,
        y: destination.y + offset.y * factor
      };
      this.directOrder(squad, target, type, index === 0);
    });

  }

  private issueHoldPosition() {
    if (!this.selected.size) return;
    this.selected.forEach(squad => {
      const anchor = { x: squad.anchor.x, y: squad.anchor.y };
      squad.setOrder({ type: "hold", target: anchor });
    });
    this.pointerMarker.visible = false;
  }

  private issueChargeNearest() {
    if (!this.selected.size) return;
    const squads = Array.from(this.selected);
    const faction = squads[0].definition.faction;
    const enemies = this.squadsInternal.filter(s => s.definition.faction !== faction);
    if (!enemies.length) return;
    const enemyAnchors = enemies.map(e => e.anchor);

    squads.forEach((squad, index) => {
      const nearest = nearestOf(squad.anchor, enemyAnchors);
      if (nearest) {
        this.directOrder(squad, nearest, "charge", index === 0);
      }
    });
  }

  private directOrder(controller: FormationController, destination: Vec2, type: OrderType, showPointer: boolean) {
    controller.setOrder({ type, target: { x: destination.x, y: destination.y } });
    if (showPointer) {
      this.showPointer(destination, type);
    }
  }

  private showPointer(destination: Vec2, type: OrderType) {
    this.pointerMarker.clear();
    this.pointerMarker.lineStyle(2 / this.root.scale.x, type === "charge" ? 0xff5555 : 0xffffff, 0.85);
    this.pointerMarker.drawCircle(destination.x, destination.y, 16);
    this.pointerMarker.moveTo(destination.x - 10, destination.y);
    this.pointerMarker.lineTo(destination.x + 10, destination.y);
    this.pointerMarker.moveTo(destination.x, destination.y - 10);
    this.pointerMarker.lineTo(destination.x, destination.y + 10);
    this.pointerMarker.visible = true;
  }

  issueAIOrder(controller: FormationController, destination: Vec2, type: OrderType) {
    this.directOrder(controller, destination, type, false);
  }

  issueAIHold(controller: FormationController, point?: Vec2) {
    const target = point ?? { x: controller.anchor.x, y: controller.anchor.y };
    controller.setOrder({ type: "hold", target });
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const key = event.key.toLowerCase();
    if (key === "tab") {
      event.preventDefault();
      this.cycleSelection(event.shiftKey ? -1 : 1);
      return;
    }
    if (key === "a") {
      if (event.metaKey) return;
      if (event.ctrlKey || (!event.ctrlKey && !event.altKey)) {
        event.preventDefault();
        this.selectAllControllable();
        return;
      }
    }
    if (!this.selected.size) return;
    switch (key) {
      case "h":
        event.preventDefault();
        this.issueHoldPosition();
        break;
      case "c":
        event.preventDefault();
        this.issueChargeNearest();
        break;
      case "escape":
        this.clearSelection();
        break;
      default:
        break;
    }
  }


  private resolveContacts(dt: number) {
    for (let i = 0; i < this.squadsInternal.length; i += 1) {
      const a = this.squadsInternal[i];
      for (let j = i + 1; j < this.squadsInternal.length; j += 1) {
        const b = this.squadsInternal[j];
        if (a.faction === b.faction) continue;
        const d = dist(a.anchor, b.anchor);
        const combined = a.contactRadius + b.contactRadius;
        if (d <= combined + 12) {
          this.applyCombat(a, b, dt, d, combined);
          a.markEngaged();
          b.markEngaged();
        }
      }
    }
    for (const squad of this.squadsInternal) {
      squad.resolveAfterCombat();
    }
  }

  private applyCombat(a: FormationController, b: FormationController, dt: number, distance: number, combined: number) {
    const closeness = clamp(1 - distance / (combined + 20), 0, 1);
    const aStrength = a.definition.stats.attack + a.chargeBonus;
    const bStrength = b.definition.stats.attack + b.chargeBonus;
    const aDefense = a.definition.stats.defense;
    const bDefense = b.definition.stats.defense;
    const base = (aStrength + bStrength) * 0.03 * dt * closeness;

    const aHit = clamp(base * (bStrength / Math.max(1, aDefense + 20)), 0, 8);
    const bHit = clamp(base * (aStrength / Math.max(1, bDefense + 20)), 0, 8);

    a.applyMoraleHit(aHit);
    b.applyMoraleHit(bHit);
  }

  private getTerrainModifier(point: Vec2): number {
    let modifier = 1;
    for (const ob of this.map.obstacles) {
      if (!("points" in ob) || !ob.points || ob.points.length === 0) continue;
      if ((ob.kind === "river" || ob.kind === "swamp" || ob.kind === "poly") && pointInPolygon(point, ob.points)) {
        if (ob.kind === "river") modifier = Math.min(modifier, 0.35);
        if (ob.kind === "swamp") modifier = Math.min(modifier, 0.6);
      }
      if ((ob.kind === "ford" || ob.kind === "bridge") && distanceToSegment(point, ob.points[0], ob.points[1]) < 32) {
        modifier = Math.max(modifier, 0.8);
      }
      if (ob.kind === "hedge" && distanceToSegment(point, ob.points[0], ob.points[1]) < 22) {
        modifier = Math.min(modifier, 0.65);
      }
      if (ob.kind === "wall" && distanceToSegment(point, ob.points[0], ob.points[1]) < 18) {
        modifier = Math.min(modifier, 0.45);
      }
    }
    return clamp(modifier, 0.2, 1.2);
  }
}

export class AIController {
  private readonly fordMidpoints: Vec2[];
  private evaluationTimer = 0;
  private readonly orderCooldown = new Map<FormationController, number>();

  constructor(private engine: BattleEngine) {
    const points: Vec2[] = [];
    for (const obstacle of engine.map.obstacles) {
      if ((obstacle.kind === "ford" || obstacle.kind === "bridge") && obstacle.points && obstacle.points.length >= 2) {
        const [a, b] = obstacle.points;
        points.push({ x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 });
      }
    }
    this.fordMidpoints = points;
  }

  update(dt: number) {
    this.reduceCooldowns(dt);
    this.evaluationTimer += dt;
    if (this.evaluationTimer < 0.4) return;
    this.evaluationTimer = 0;

    const squads = this.engine.ctx.squads;
    const defenders = squads.filter(s => s.definition.faction === "defender");
    const attackers = squads.filter(s => s.definition.faction === "attacker");
    if (!defenders.length || !attackers.length) return;

    const infantry = defenders.filter(d => d.definition.stats.speed < 130);
    const cavalry = defenders.filter(d => d.definition.stats.speed >= 130);

    this.maintainRidgeLine(infantry);
    this.respondToThreats(infantry, attackers);
    this.coordinateCavalry(cavalry, attackers);
  }

  private reduceCooldowns(dt: number) {
    for (const [squad, remaining] of Array.from(this.orderCooldown.entries())) {
      const next = remaining - dt;
      if (next <= 0) {
        this.orderCooldown.delete(squad);
      } else {
        this.orderCooldown.set(squad, next);
      }
    }
  }

  private canIssue(squad: FormationController): boolean {
    return !this.orderCooldown.has(squad);
  }

  private setCooldown(squad: FormationController, seconds: number) {
    this.orderCooldown.set(squad, seconds);
  }

  private maintainRidgeLine(infantry: FormationController[]) {
    if (!infantry.length) return;
    const anchorPoints = [...this.engine.map.defenderSpawns, ...this.engine.map.objectives];
    for (const squad of infantry) {
      if (!this.canIssue(squad)) continue;
      const anchor = nearestOf(squad.anchor, anchorPoints);
      if (!anchor) continue;
      const distanceToAnchor = dist(squad.anchor, anchor);
      if (distanceToAnchor > 140 && squad.order.type === "hold") {
        this.engine.issueAIOrder(squad, anchor, "move");
        this.setCooldown(squad, 4);
      }
    }
  }

  private respondToThreats(infantry: FormationController[], attackers: FormationController[]) {
    if (!infantry.length) return;

    for (const attacker of attackers) {
      const fordProximity = this.closestFordDistance(attacker.anchor);
      const acrossRiver = attacker.anchor.x > this.engine.map.width * 0.5 + 40;
      if (!acrossRiver && fordProximity > 200) continue;

      let best: FormationController | null = null;
      let bestDist = Infinity;
      for (const defender of infantry) {
        if (!this.canIssue(defender)) continue;
        const d = dist(defender.anchor, attacker.anchor);
        if (d < bestDist) {
          best = defender;
          bestDist = d;
        }
      }
      if (!best) continue;

      const orderType: OrderType = bestDist < 180 ? "charge" : "move";
      this.engine.issueAIOrder(best, attacker.anchor, orderType);
      this.setCooldown(best, orderType === "charge" ? 5 : 3.5);
    }
  }

  private coordinateCavalry(cavalry: FormationController[], attackers: FormationController[]) {
    if (!cavalry.length || !attackers.length) return;

    for (const cav of cavalry) {
      if (!this.canIssue(cav)) continue;

      let target: FormationController | null = null;
      let bestScore = -Infinity;
      for (const attacker of attackers) {
        const distance = dist(cav.anchor, attacker.anchor);
        const fordDist = this.closestFordDistance(attacker.anchor);
        const isAcross = attacker.anchor.x > this.engine.map.width * 0.5;

        const threatScore = (isAcross ? 60 : 0) + (fordDist < 160 ? 40 : 0);
        const score = threatScore - distance * 0.32;
        if (score > bestScore) {
          bestScore = score;
          target = attacker;
        }
      }

      if (target && bestScore > -120) {
        this.engine.issueAIOrder(cav, target.anchor, "charge");
        this.setCooldown(cav, 6);
      } else {
        const fallback = nearestOf(cav.anchor, this.engine.map.defenderSpawns);
        if (fallback && dist(cav.anchor, fallback) > 150) {
          this.engine.issueAIOrder(cav, fallback, "move");
          this.setCooldown(cav, 3.5);
        }
      }
    }
  }

  private closestFordDistance(point: Vec2): number {
    if (!this.fordMidpoints.length) return Infinity;
    let best = Infinity;
    for (const ford of this.fordMidpoints) {
      const d = dist(point, ford);
      if (d < best) best = d;
    }
    return best;
  }
}

function renderMap(target: PIXI.Container | PIXI.Application, map: BattleMap) {
  const parent = target instanceof PIXI.Application ? target.stage : target;
  const layer = new PIXI.Container();
  parent.addChild(layer);

  const g = new PIXI.Graphics();
  layer.addChild(g);

  g.beginFill(BASE_BACKGROUND);
  g.drawRect(0, 0, map.width, map.height);
  g.endFill();

  for (const o of map.obstacles) {
    switch (o.kind) {
      case "river":
        if (!o.points) break;
        g.beginFill(0x244b7a, 0.92).drawPolygon(flattenPoints(o.points)).endFill();
        break;
      case "swamp":
        if (!o.points) break;
        g.beginFill(0x1d4c3a, 0.85).drawPolygon(flattenPoints(o.points)).endFill();
        break;
      case "poly":
        if (!o.points) break;
        g.beginFill(0x4a4a4a, 1).drawPolygon(flattenPoints(o.points)).endFill();
        break;
      case "ford":
        if (!o.points) break;
        g.lineStyle(10, 0xa0d8ff, 0.7).moveTo(o.points[0].x, o.points[0].y).lineTo(o.points[1].x, o.points[1].y);
        break;
      case "bridge":
        if (!o.points) break;
        g.lineStyle(12, 0xbba98c, 0.9).moveTo(o.points[0].x, o.points[0].y).lineTo(o.points[1].x, o.points[1].y);
        break;
      case "wall":
        if (!o.points) break;
        g.lineStyle(6, 0x9b9074, 1).moveTo(o.points[0].x, o.points[0].y).lineTo(o.points[1].x, o.points[1].y);
        break;
      case "hedge":
        if (!o.points) break;
        g.lineStyle(8, 0x8a5a2f, 1).moveTo(o.points[0].x, o.points[0].y).lineTo(o.points[1].x, o.points[1].y);
        break;
      case "ridge":
        if (!o.points) break;
        g.lineStyle(4, 0xdac27a, 0.8).moveTo(o.points[0].x, o.points[0].y).lineTo(o.points[1].x, o.points[1].y);
        break;
      case "hamlet":
        g.beginFill(0xc4b28b, 1).drawCircle(o.center.x, o.center.y, o.radius).endFill();
        break;
      case "tree":
        g.beginFill(0x2d5532, 1).drawCircle(o.center.x, o.center.y, o.radius).endFill();
        break;
    }
  }

  for (const p of map.objectives) {
    g.beginFill(0xffdd55).drawCircle(p.x, p.y, 10).endFill();
  }
  for (const p of map.attackerSpawns) g.beginFill(0xff5555).drawCircle(p.x, p.y, 6).endFill();
  for (const p of map.defenderSpawns) g.beginFill(0x55aaff).drawCircle(p.x, p.y, 6).endFill();
}

function drawWaypoints(target: PIXI.Container | PIXI.Application, map: BattleMap) {
  const parent = target instanceof PIXI.Application ? target.stage : target;
  const g = new PIXI.Graphics();
  parent.addChild(g);
  g.lineStyle(1, 0xffffff, 0.5);
  for (const o of map.obstacles) {
    if ((o.kind === "ford" || o.kind === "bridge") && o.points) {
      for (const p of o.points) g.drawCircle(p.x, p.y, 4);
    }
  }
}

function flattenPoints(pts: Vec2[]): number[] {
  const out: number[] = [];
  for (const p of pts) { out.push(p.x, p.y); }
  return out;
}

function buildFormation(def: SquadDefinition): Vec2[] {
  const count = def.unitCount;
  const offsets: Vec2[] = [];
  const spacing = def.spacing;
  switch (def.formation) {
    case "line": {
      const ranks = Math.min(3, Math.max(1, Math.round(count / 8)));
      const files = Math.ceil(count / ranks);
      for (let i = 0; i < count; i += 1) {
        const rank = i % ranks;
        const file = Math.floor(i / ranks);
        const x = (rank - (ranks - 1) / 2) * spacing * 0.9;
        const y = (file - (files - 1) / 2) * spacing * 1.2;
        offsets.push({ x, y });
      }
      break;
    }
    case "column": {
      const files = Math.min(2, Math.max(1, Math.round(count / 10)));
      const ranks = Math.ceil(count / files);
      for (let i = 0; i < count; i += 1) {
        const file = i % files;
        const rank = Math.floor(i / files);
        const x = (rank - (ranks - 1) / 2) * spacing * 1.1;
        const y = (file - (files - 1) / 2) * spacing * 0.8;
        offsets.push({ x, y });
      }
      break;
    }
    case "wedge": {
      let placed = 0;
      let row = 0;
      while (placed < count) {
        const rowCount = Math.min(count - placed, row + 1);
        for (let i = 0; i < rowCount; i += 1) {
          const x = (row + 0.5) * spacing * 1.05;
          const y = (i - (rowCount - 1) / 2) * spacing * 1.1;
          offsets.push({ x, y });
        }
        placed += rowCount;
        row += 1;
      }
      for (const o of offsets) {
        o.x -= (row - 1) * spacing * 0.75;
      }
      break;
    }
  }
  return offsets;
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addVec(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subVec(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scaleVec(v: Vec2, f: number): Vec2 {
  return { x: v.x * f, y: v.y * f };
}

function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerpAngle(a: number, b: number, t: number): number {
  const shortest = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  return a + shortest * t;
}

function rotateAndTranslate(offset: Vec2, angle: number, origin: Vec2): Vec2 {
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  return {
    x: origin.x + offset.x * c - offset.y * s,
    y: origin.y + offset.x * s + offset.y * c
  };
}

function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-6) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = subVec(b, a);
  const lenSq = ab.x * ab.x + ab.y * ab.y;
  if (lenSq === 0) return dist(p, a);
  const t = clamp(((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / lenSq, 0, 1);
  const proj = { x: a.x + ab.x * t, y: a.y + ab.y * t };
  return dist(p, proj);
}

function nearestOf(p: Vec2, pts: Vec2[]): Vec2 | null {
  let best: Vec2 | null = null; let bd = Infinity;
  for (const q of pts) { const d = dist(p, q); if (d < bd) { bd = d; best = q; } }
  return best;
}

function lightenColor(color: number, amount: number): number {
  const r = clamp(((color >> 16) & 0xff) / 255 + amount, 0, 1);
  const g = clamp(((color >> 8) & 0xff) / 255 + amount, 0, 1);
  const b = clamp((color & 0xff) / 255 + amount, 0, 1);
  return ((r * 255) << 16) + ((g * 255) << 8) + (b * 255);
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface GreentideOptions {
  width?: number;
  height?: number;
  debug?: boolean;
}

/**
 * Bootstraps the Greentide free-move battle demo inside the given container.
 */
export async function startGreentideDemo(container: HTMLElement, options?: GreentideOptions): Promise<BattleEngine> {
  const map = GREENTIDE_MAP;
  const width = options?.width ?? map.width;
  const height = options?.height ?? map.height;

  const app = new PIXI.Application();
  await app.init({
    width,
    height,
    background: BASE_BACKGROUND,
    antialias: true
  });

  container.innerHTML = "";
  container.appendChild(app.canvas);

  const scale = Math.min(width / map.width, height / map.height);
  const engine = new BattleEngine(app, map, { debug: options?.debug, stageScale: scale });
  engine.start();
  return engine;
}
