/**
 * Battle System Types
 * Hex-grid tactical combat with hero commanders and mercenary units
 */

export interface HexPosition {
    q: number;
    r: number;
}

export interface Damage {
    amount: number;
    type: string;
}

export interface UnitStats {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    mag: number;
    res: number;
    spd: number;
    rng: number;
    move: number;
}

export interface StatusEffect {
    id: string;
    name: string;
    duration: number;
    effects: Partial<UnitStats>;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    apCost: number;
    cooldown: number;
    range: number;
}

export interface Unit {
    id: string;
    name: string;
    kind: "HeroCommander" | "Mercenary" | "Monster" | "NPC" | "Boss";
    faction: "Player" | "Enemy" | "Neutral";
    race: string;
    archetype: string;
    level: number;
    stats: UnitStats;
    statuses: StatusEffect[];
    skills: string[]; // Changed to string[] to match ability IDs
    pos?: HexPosition;
    isCommander?: boolean;
    isDead: boolean; // Required property to avoid undefined issues
    gear?: { gearScore?: number }; // Add gear property
    facing?: number; // Add facing for hex directions (0-5)
}

export interface Ability {
    id: string;
    name: string;
    type: "command" | "spell" | "skill";
    apCost: number;
    range: number;
    shape: "single" | "line" | "blast1" | "blast2" | "ally" | "self";
    damage?: Damage;
    healing?: number;
    aoeRadius?: number;
    cooldown: number;
    description?: string;
}

export interface CommanderAura {
    name: string;
    stats: Partial<UnitStats>;
    range?: number;
}

export interface Commander {
    unitId: string;
    aura: CommanderAura;
    abilities: Ability[];
    runtime: {
        cooldowns?: { [abilityId: string]: number };
        actionPoints?: number;
    };
}

export interface HexTile {
    q: number;
    r: number;
    terrain: "Grass" | "Forest" | "Mountain" | "Water" | "Desert" | "Swamp";
    elevation: number;
    passable: boolean;
    cover?: number;
    occupied?: string; // unitId
}

export interface BattleGrid {
    width: number;
    height: number;
    tiles: HexTile[];
}

export interface DeploymentZone {
    hexes: HexPosition[];
    faction: "Player" | "Enemy";
}

export interface BattleContext {
    seed: string;
    biome: string;
    site?: "wilds" | "settlement" | "dungeon";
    weather?: string;
    timeOfDay?: "Dawn" | "Day" | "Dusk" | "Night";
}

export type BattlePhase = "Setup" | "HeroTurn" | "UnitsTurn" | "EnemyTurn" | "Victory" | "Defeat";

export interface BattleState {
    id: string;
    turn: number;
    phase: BattlePhase;
    grid: BattleGrid;
    context: BattleContext;
    commander: Commander;
    units: Unit[];
    initiative: string[]; // unit IDs in turn order
    friendlyDeployment: DeploymentZone;
    enemyDeployment: DeploymentZone;
    log: string[];
    selectedUnit?: string;
    targetHex?: HexPosition;
}

export interface BattleResult {
    victory: boolean;
    experience: number;
    loot: any[];
    casualties: string[]; // unit IDs that were defeated
}