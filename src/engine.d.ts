// Minimal type stubs for the game engine until the real one is wired

export interface ClassDefinition {
  name: string;
  description: string;
  statModifiers: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  primaryStats: string[];
  abilities: string[];
  equipment: string[];
  faction: string;
}

export interface Character {
  name: string;
  class: string;
  classData?: ClassDefinition;
  baseStats: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  finalStats: {
    strength: number;
    constitution: number;
    wisdom: number;
    intelligence: number;
    dexterity: number;
    charisma: number;
  };
  hitPoints: number;
  level: number;
  experience: number;
  abilities: string[];
  equipment: string[];
  faction?: string;
}

export interface Preset {
  name: string;
  seed?: string;
  description?: string;
  factions?: string[];
  classes?: string[];
  lore?: string;
}

export interface Engine {
  state: {
    meta: {
      seed?: string;
      presets: {
        list: Array<Preset>;
        loaded: string | { name: string; id?: string } | undefined;
      };
    };
  };
  applyPresetByName?: (name: string) => void;
  setSeed?: (seed: string) => void;
  loadWorldPresets?: () => Promise<void>;
}