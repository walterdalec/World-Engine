/**
 * Content Pack Schemas
 * Canvas 03 - Zod schemas for content validation
 */

import { z } from 'zod';

/**
 * Biome Pack Schema
 */
export const BiomePackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  weights: z.object({
    elevation: z.tuple([z.number(), z.number()]),
    moisture: z.tuple([z.number(), z.number()]),
    temperature: z.tuple([z.number(), z.number()])
  }),
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional()
  }),
  spawnRules: z.object({
    settlements: z.number().min(0).max(1),
    resources: z.array(z.string()),
    encounters: z.array(z.string())
  })
});

export type BiomePack = z.infer<typeof BiomePackSchema>;

/**
 * Unit Pack Schema
 */
export const UnitPackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string(), // melee, ranged, caster, support, tank, skirmisher
  stats: z.object({
    hp: z.number().int().positive(),
    atk: z.number().int().positive(),
    def: z.number().int().nonnegative(),
    mag: z.number().int().nonnegative(),
    res: z.number().int().nonnegative(),
    spd: z.number().int().positive(),
    move: z.number().int().positive(),
    range: z.number().int().positive()
  }),
  abilities: z.array(z.string()),
  traits: z.array(z.string()),
  cost: z.object({
    gold: z.number().int().nonnegative(),
    recruits: z.number().int().positive()
  })
});

export type UnitPack = z.infer<typeof UnitPackSchema>;

/**
 * Item Pack Schema
 */
export const ItemPackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slot: z.string(), // weapon, armor, accessory, consumable, quest
  effects: z.array(z.object({
    type: z.string(),
    value: z.number()
  })),
  rarity: z.string(), // common, uncommon, rare, epic, legendary
  value: z.number().int().nonnegative()
});

export type ItemPack = z.infer<typeof ItemPackSchema>;

/**
 * Spell Pack Schema
 */
export const SpellPackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  school: z.string(), // fire, frost, nature, shadow, holy, arcane
  cost: z.object({
    mp: z.number().int().positive(),
    cooldown: z.number().int().nonnegative()
  }),
  target: z.string(), // self, ally, enemy, aoe, line, cone
  effect: z.object({
    damage: z.number().int().nonnegative().optional(),
    heal: z.number().int().nonnegative().optional(),
    status: z.string().optional(),
    duration: z.number().int().nonnegative().optional()
  })
});

export type SpellPack = z.infer<typeof SpellPackSchema>;

/**
 * Faction Pack Schema
 */
export const FactionPackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ethos: z.string(), // lawful, neutral, chaotic, militant, merchant, mystic
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/)
  }),
  units: z.array(z.string()),
  aiProfile: z.object({
    aggression: z.number().min(0).max(1),
    economy: z.number().min(0).max(1),
    expansion: z.number().min(0).max(1)
  })
});

export type FactionPack = z.infer<typeof FactionPackSchema>;

/**
 * Pack Manifest Schema (for pack metadata)
 */
export const PackManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  author: z.string().optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional()
});

export type PackManifest = z.infer<typeof PackManifestSchema>;

/**
 * Full Content Pack Schema
 */
export const ContentPackSchema = z.object({
  manifest: PackManifestSchema,
  biomes: z.array(BiomePackSchema).optional(),
  units: z.array(UnitPackSchema).optional(),
  items: z.array(ItemPackSchema).optional(),
  spells: z.array(SpellPackSchema).optional(),
  factions: z.array(FactionPackSchema).optional()
});

export type ContentPack = z.infer<typeof ContentPackSchema>;
