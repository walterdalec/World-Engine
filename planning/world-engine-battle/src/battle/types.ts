/** Battle Types — top‑down grid, future 3D‑ready */
export type Biome =
  | "Ocean" | "Coast" | "Grass" | "Forest" | "Jungle" | "Savanna"
  | "Desert" | "Taiga" | "Tundra" | "Swamp" | "Mountain" | "Snow"
  | "Settlement" | "Dungeon";

export type TileKind = "plain" | "forest" | "rough" | "sand" | "water" | "swamp" | "snow" | "road" | "wall" | "cover" | "hazard" | "spawn_friendly" | "spawn_enemy";

export interface Tile {
  x: number; y: number;
  kind: TileKind;
  elevation?: number;      // 0..n for future LOS
  cover?: number;          // 0..1
  movementCost: number;    // >=1
  blocked: boolean;        // cannot enter if true
}

export interface Grid {
  width: number;
  height: number;
  tiles: Tile[]; // length = width*height
}

export type Faction = "Player" | "Enemy" | "Neutral";

export type DamageType = "physical" | "fire" | "frost" | "nature" | "shadow" | "holy";

export interface Stats {
  hp: number; maxHp: number;
  atk: number; def: number;
  mag: number; res: number;
  spd: number; // affects initiative/turn order
  rng: number; // basic attack range (tiles)
  move: number; // tiles per action
  morale?: number; // 0..100
}

export interface StatusEffect {
  id: string;
  name: string;
  duration: number; // turns remaining
  modifiers?: Partial<Stats>;
  tags?: string[]; // e.g., "stun","poison","root"
}

export type UnitKind = "HeroCommander" | "Mercenary" | "Monster" | "Boss";

export interface GearSummary {
  gearScore?: number; // used for revive price
}

export interface Unit {
  id: string;
  name: string;
  kind: UnitKind;
  faction: Faction;
  race: string;
  archetype: string;
  level: number;
  gear?: GearSummary;
  pos?: { x: number; y: number }; // undefined until placed
  facing?: number; // radians for future 3D
  stats: Stats;
  statuses: StatusEffect[];
  skills: string[]; // skill ids usable by this unit
  isDead?: boolean;
  isCommander?: boolean; // true for the player's hero (off‑field commander)
}

export type TargetShape = "self" | "ally" | "enemy" | "tile" | "line" | "blast1" | "blast2" | "blast3" | "cone";

export interface Ability {
  id: string;
  name: string;
  type: "skill" | "spell" | "command";
  apCost: number;           // action points per use (if using AP) or 1 per action
  range: number;            // tiles; 0=melee
  damage?: { amount: number; type: DamageType } | null;
  healing?: number | null;
  statusApply?: StatusEffect[];
  shape: TargetShape;
  aoeRadius?: number;       // for blast shapes
  cooldown?: number;        // in rounds
  charges?: number;         // per battle
  tags?: string[];          // "ranged","aoe","buff","debuff"
  requiresLOS?: boolean;    // line of sight
  friendlyFire?: boolean;
  commanderOnly?: boolean;  // only the hero commander can use
}

export interface AbilityRuntimeState {
  id: string;
  remainingCooldown: number;
  remainingCharges?: number;
}

export interface Commander {
  unitId: string; // references a Unit with isCommander=true (off‑field)
  aura?: { name: string; stats: Partial<Stats> }; // passive advantage for the hero
  abilities: Ability[]; // command abilities usable during hero turn
  runtime: Record<string, AbilityRuntimeState>;
}

export interface DeploymentZone {
  tiles: { x:number; y:number }[];
}

export interface BattleContext {
  seed: string;
  biome: Biome;
  site?: "wilds" | "settlement" | "dungeon";
  weather?: "clear" | "rain" | "snow" | "fog";
}

export type Phase = "Setup" | "HeroTurn" | "UnitsTurn" | "EnemyTurn" | "Resolve" | "Victory" | "Defeat";

export interface BattleState {
  id: string;
  turn: number;
  phase: Phase;
  grid: Grid;
  context: BattleContext;
  commander: Commander;
  units: Unit[];
  initiative: string[]; // ordered unit ids for the round (excludes commander, who has own phase)
  activeUnitId?: string;
  friendlyDeployment: DeploymentZone;
  enemyDeployment: DeploymentZone;
  log: string[];
}
