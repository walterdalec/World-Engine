// Minimal type stubs for the game engine until the real one is wired
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