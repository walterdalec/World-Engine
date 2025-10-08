/**
 * Strategic Layer Types - TODO #12 
 * Brigandine-style campaign layer with territory control, seasonal progression,
 * and World Engine faction integration
 */

export type ResourceKind = 'gold' | 'mana' | 'materials' | 'food';
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export type FactionId = 'Player' | 'Sylvan' | 'Shadow' | 'Storm' | 'Crystal' | 'Flame' | 'Void' | string;

export interface Treasury {
    gold: number;
    mana: number;
    materials: number;
    food: number;
}

export interface Faction {
    id: FactionId;
    name: string;
    color?: string;
    species: 'human' | 'sylvanborn' | 'nightborn' | 'stormcaller'; // World Engine species
    treasury: Treasury;
    laws?: { taxRate: number }; // 0..100
    morale?: number; // strategic morale 0..100 (averaged from battles)
}

export interface Castle {
    id: string;
    tier: 1 | 2 | 3;
    siege?: SiegeState;
    upgrades: BuildingUpgrade[];
    recruitQueue: RecruitJob[];
}

export interface SiegeState {
    level: 0 | 1 | 2 | 3;
    supplyCut: boolean;
}

export interface BuildingUpgrade {
    id: string;
    done: boolean;
    eta: number;
}

export interface RecruitJob {
    unitType: 'knight' | 'ranger' | 'chanter' | 'mystic' | 'guardian' | 'corsair'; // World Engine archetypes
    eta: number;
    cost: Treasury;
    upkeep: Treasury;
}

export interface Territory {
    id: string;
    owner: FactionId;
    neighbors: string[];
    tags: ('capital' | 'mine' | 'crystal' | 'lumber' | 'farm' | 'port' | 'road' | 'shrine' | 'ruins')[];
    site?: Castle; // present if castle/stronghold here
    unrest: number; // 0..100 (affects income)
    supply: boolean; // computed each season
    garrison: string[]; // unit ids held here (unit meta from character system)
}

export interface CampaignState {
    seed: number;
    turn: number;
    season: Season;
    year: number;
    factions: Map<FactionId, Faction>;
    territories: Map<string, Territory>;
    unitDefs: Record<string, {
        upkeep: Treasury;
        recruit: Treasury;
        role: 'commander' | 'warrior' | 'scout' | 'mage' | 'support';
        archetype: 'knight' | 'ranger' | 'chanter' | 'mystic' | 'guardian' | 'corsair';
    }>;
    logs: string[];
}

// ---------- World Engine Faction Templates ----------
export const WORLD_ENGINE_FACTIONS = {
    'Sylvan': {
        name: 'Sylvan Concord',
        species: 'sylvanborn' as const,
        color: '#22c55e',
        preferredArchetypes: ['guardian', 'ranger', 'mystic']
    },
    'Shadow': {
        name: 'Nightborn Covenant',
        species: 'nightborn' as const,
        color: '#8b5cf6',
        preferredArchetypes: ['corsair', 'mystic', 'chanter']
    },
    'Storm': {
        name: 'Stormcaller Clans',
        species: 'stormcaller' as const,
        color: '#06b6d4',
        preferredArchetypes: ['knight', 'chanter', 'guardian']
    },
    'Player': {
        name: 'Human Alliance',
        species: 'human' as const,
        color: '#3b82f6',
        preferredArchetypes: ['knight', 'ranger', 'mystic', 'guardian', 'chanter', 'corsair']
    }
};

// ---------- Test/Fixture helpers (simple, deterministic) ----------
export function mkTreasury(g = 0, m = 0, mat = 0, f = 0): Treasury {
    return { gold: g, mana: m, materials: mat, food: f };
}

export function mkFaction(id: FactionId, name = id): Faction {
    const template = WORLD_ENGINE_FACTIONS[id as keyof typeof WORLD_ENGINE_FACTIONS];
    return {
        id,
        name: template?.name || String(name),
        species: template?.species || 'human',
        color: template?.color,
        treasury: mkTreasury()
    };
}

export function mkCastle(id: string, tier: 1 | 2 | 3 = 1): Castle {
    return { id, tier, upgrades: [], recruitQueue: [] };
}

export function mkTerritory(
    id: string,
    owner: FactionId,
    neighbors: string[] = [],
    tags: Territory['tags'] = [],
    site?: Castle
): Territory {
    return {
        id,
        owner,
        neighbors: [...neighbors],
        tags: [...tags],
        site,
        unrest: 0,
        supply: true,
        garrison: []
    };
}

export function mkCampaign(seed = 1): CampaignState {
    return {
        seed,
        turn: 0,
        season: 'Spring',
        year: 1,
        factions: new Map<FactionId, Faction>([
            ['Player', mkFaction('Player')]
        ]),
        territories: new Map(),
        unitDefs: {
            // World Engine archetypes with proper costs
            'knight': {
                upkeep: mkTreasury(15, 0, 5, 8),
                recruit: mkTreasury(100, 0, 50, 0),
                role: 'warrior',
                archetype: 'knight'
            },
            'ranger': {
                upkeep: mkTreasury(12, 0, 3, 6),
                recruit: mkTreasury(80, 0, 30, 0),
                role: 'scout',
                archetype: 'ranger'
            },
            'chanter': {
                upkeep: mkTreasury(10, 5, 2, 5),
                recruit: mkTreasury(90, 40, 20, 0),
                role: 'support',
                archetype: 'chanter'
            },
            'mystic': {
                upkeep: mkTreasury(8, 8, 2, 4),
                recruit: mkTreasury(70, 60, 15, 0),
                role: 'mage',
                archetype: 'mystic'
            },
            'guardian': {
                upkeep: mkTreasury(13, 3, 4, 7),
                recruit: mkTreasury(85, 30, 40, 0),
                role: 'support',
                archetype: 'guardian'
            },
            'corsair': {
                upkeep: mkTreasury(11, 0, 4, 5),
                recruit: mkTreasury(75, 0, 35, 0),
                role: 'scout',
                archetype: 'corsair'
            }
        },
        logs: []
    };
}