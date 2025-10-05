export type ID = string;

export type HexCoord = {
  q: number;
  r: number;
};

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export type ArmyStatus = 'Idle' | 'Marching' | 'Siege' | 'Battle' | 'Recovering';
export type ArmyStance = 'Raid' | 'Hold' | 'Consolidate';
export type ArmyObjectiveKind =
  | 'SeizeRegion'
  | 'HoldRegion'
  | 'RaidRoute'
  | 'EscortCaravan'
  | 'BreakSiege';

export interface ArmyObjective {
  id: ID;
  kind: ArmyObjectiveKind;
  targetRegionId: ID;
  expiresTurn: number;
  reward?: number;
}

export interface Region {
  id: ID;
  name: string;
  center: HexCoord;
  neighbors: ID[];
  biome: 'Grass' | 'Forest' | 'Settlement' | 'Desert' | 'Swamp' | 'Taiga' | 'Snow';
  wealth: number;
  fort: number;
  ownerId: ID | null;
  garrison: Army | null;
  unrest: number;
}

export interface ArmyUnit {
  id: ID;
  kind: 'Infantry' | 'Archer' | 'Cavalry' | 'Mage' | 'Siege';
  level: number;
  gearScore: number;
  upkeep: number;
}

export interface Army {
  id: ID;
  name: string;
  factionId: ID;
  strength: number;
  morale: number;
  upkeep: number;
  locationRegionId: ID;
  targetRegionId?: ID;
  status: ArmyStatus;
  supplies: number;
  units?: ArmyUnit[];
  path?: ID[];
  marchSpeed?: number;
  supplyHubId?: ID;
  stance?: ArmyStance;
  stanceUntilTurn?: number;
  objective?: ArmyObjective;
  moveCooldown?: number;
}

export interface FactionAI {
  aggression: number;
  caution: number;
  opportunism: number;
  diplomacy: number;
}

export interface WarTerms {
  cedeRegions?: ID[];
  reparations?: number;
}

export interface War {
  enemyId: ID;
  startTurn: number;
  warScore: number;
  battles: ID[];
  terms?: WarTerms;
}

export interface Faction {
  id: ID;
  name: string;
  color: string;
  treasury: number;
  income: number;
  upkeep: number;
  regions: ID[];
  armies: ID[];
  stance: 'Peace' | 'War' | 'Truce';
  relations: Record<ID, number>;
  wars: Record<ID, War>;
  ai: FactionAI;
}

export interface TradeRoute {
  id: ID;
  from: ID;
  to: ID;
  wealthFlow: number;
  danger: number;
  activeCaravanId?: ID;
  baseWealthFlow?: number;
}

export interface TradeTreaty {
  a: ID;
  b: ID;
  bonus: number;
  startTurn: number;
}

export interface Caravan {
  id: ID;
  routeId: ID;
  ownerFactionId: ID;
  value: number;
  guards: number;
  locationIndex: number;
  direction: 1 | -1;
  status: 'Travel' | 'Ambush' | 'Destroyed' | 'Arrived';
}

export interface ContrabandRoute {
  id: ID;
  from: ID;
  to: ID;
  valuePerSeason: number;
  risk: number;
  activeSmugglerId?: ID;
}

export interface Smuggler {
  id: ID;
  routeId: ID;
  value: number;
  stealth: number;
  locationIndex: number;
  direction: 1 | -1;
  status: 'Travel' | 'Intercepted' | 'Destroyed' | 'Arrived';
}

export interface Difficulty {
  aiIncomeMult: number;
  aiAggressionBias: number;
  aiAttritionMitigation: number;
}

export interface Frontline {
  id: ID;
  regions: ID[];
  a: ID;
  b: ID;
  pressureA: number;
  pressureB: number;
}

export type PeaceTermKind = 'Truce' | 'Cede' | 'Reparations' | 'DemilitarizedZone';

export interface PeaceDeal {
  kind: PeaceTermKind;
  cedeRegions?: ID[];
  reparations?: {
    payer: ID;
    receiver: ID;
    perSeason: number;
    seasons: number;
    remaining?: number;
  };
  dmz?: {
    regionIds: ID[];
    untilTurn: number;
  };
}

export type ReparationPayment = NonNullable<PeaceDeal['reparations']>;

export interface WorldEventBattle {
  id: ID;
  t: number;
  kind: 'Battle';
  regionId: ID;
  a: ID;
  b: ID;
  result: 'A' | 'B' | 'Stalemate';
  delta: number;
}

export interface WorldEventSiegeStarted {
  id: ID;
  t: number;
  kind: 'SiegeStarted';
  regionId: ID;
  attacker: ID;
}

export interface WorldEventSiegeResolved {
  id: ID;
  t: number;
  kind: 'SiegeResolved';
  regionId: ID;
  winner: ID;
}

export interface WorldEventTreaty {
  id: ID;
  t: number;
  kind: 'Treaty';
  a: ID;
  b: ID;
  terms: 'Truce' | 'Peacedeal';
}

export interface WorldEventRevolt {
  id: ID;
  t: number;
  kind: 'Revolt';
  regionId: ID;
}

export type WorldEvent =
  | WorldEventBattle
  | WorldEventSiegeStarted
  | WorldEventSiegeResolved
  | WorldEventTreaty
  | WorldEventRevolt;

export interface WorldState {
  turn: number;
  season: Season;
  rngSeed: number;
  factions: Record<ID, Faction>;
  regions: Record<ID, Region>;
  armies: Record<ID, Army>;
  events: WorldEvent[];
  difficulty?: Difficulty;
  tradeRoutes?: Record<ID, TradeRoute>;
  caravans?: Record<ID, Caravan>;
  tradeTreaties?: TradeTreaty[];
  contraband?: Record<ID, ContrabandRoute>;
  smugglers?: Record<ID, Smuggler>;
  frontlines?: Frontline[];
  activeReparations?: ReparationPayment[];
}

export interface AIContext {
  world: WorldState;
  rand: () => number;
}

export type PlayerOpportunity = {
  kind: 'Relief' | 'Escort' | 'Raid' | 'Intercept' | 'Smuggle';
  regionId: ID;
  reward?: number;
  routeId?: ID;
};
