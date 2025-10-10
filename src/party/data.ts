/**
 * Canvas 10 - Recruit Definitions & Spawn Tables
 * 
 * Registry of prebuilt recruits with fixed identities and builds
 * Spawns based on region tier and seed for determinism
 */

import type { RecruitDef, RecruitSpawnConfig } from './types';
import { SeededRandom } from '../proc/noise';

/**
 * Base recruit templates - expanded pool for variety
 */
const RECRUIT_TEMPLATES: Omit<RecruitDef, 'id' | 'level'>[] = [
  // Warriors
  {
    name: 'Marcus the Ironclad',
    race: 'human',
    classId: 'knight',
    sex: 'male',
    age: 32,
    origin: 'tavern_warrior',
    portraitId: 'human_knight_male_1',
    baseStats: { STR: 16, DEX: 12, CON: 15, INT: 10, WIS: 11, CHA: 13 },
    skills: ['heavy_armor', 'shield_bash', 'endurance'],
    traits: ['brave', 'disciplined'],
    upkeep: 15,
    hireCost: 100
  },
  {
    name: 'Kira Steelheart',
    race: 'human',
    classId: 'guardian',
    sex: 'female',
    age: 28,
    origin: 'tavern_warrior',
    portraitId: 'human_guardian_female_1',
    baseStats: { STR: 15, DEX: 13, CON: 16, INT: 11, WIS: 12, CHA: 14 },
    skills: ['protection', 'rally', 'defensive_stance'],
    traits: ['loyal', 'resilient'],
    upkeep: 18,
    hireCost: 120
  },

  // Rangers
  {
    name: 'Theron Swiftbow',
    race: 'sylvanborn',
    classId: 'ranger',
    sex: 'male',
    age: 45,
    origin: 'tavern_scout',
    portraitId: 'sylvanborn_ranger_male_1',
    baseStats: { STR: 12, DEX: 17, CON: 13, INT: 12, WIS: 15, CHA: 11 },
    skills: ['archery', 'tracking', 'stealth'],
    traits: ['keen_eye', 'woodsman'],
    upkeep: 12,
    hireCost: 90
  },
  {
    name: 'Raven Nightwhisper',
    race: 'nightborn',
    classId: 'corsair',
    sex: 'female',
    age: 24,
    origin: 'tavern_rogue',
    portraitId: 'nightborn_corsair_female_1',
    baseStats: { STR: 13, DEX: 18, CON: 12, INT: 14, WIS: 11, CHA: 15 },
    skills: ['dual_wield', 'evasion', 'backstab'],
    traits: ['nimble', 'opportunist'],
    upkeep: 14,
    hireCost: 110
  },

  // Mages
  {
    name: 'Elara Frostweaver',
    race: 'human',
    classId: 'mystic',
    sex: 'female',
    age: 36,
    origin: 'tavern_mage',
    portraitId: 'human_mystic_female_1',
    baseStats: { STR: 9, DEX: 12, CON: 11, INT: 17, WIS: 16, CHA: 13 },
    skills: ['frost_magic', 'meditation', 'arcane_barrier'],
    traits: ['scholarly', 'focused'],
    upkeep: 20,
    hireCost: 150
  },
  {
    name: 'Zephyr Stormcaller',
    race: 'stormcaller',
    classId: 'chanter',
    sex: 'male',
    age: 41,
    origin: 'tavern_mage',
    portraitId: 'stormcaller_chanter_male_1',
    baseStats: { STR: 11, DEX: 13, CON: 12, INT: 16, WIS: 15, CHA: 16 },
    skills: ['lightning', 'wind_magic', 'inspire'],
    traits: ['charismatic', 'weatherwise'],
    upkeep: 22,
    hireCost: 160
  },

  // Locked/Quest Recruits
  {
    name: 'Grimjaw the Exiled',
    race: 'human',
    classId: 'knight',
    sex: 'male',
    age: 47,
    origin: 'quest_redemption',
    portraitId: 'human_knight_male_2',
    baseStats: { STR: 18, DEX: 11, CON: 17, INT: 12, WIS: 13, CHA: 10 },
    skills: ['berserker', 'intimidate', 'cleave'],
    traits: ['vengeful', 'scarred'],
    upkeep: 25,
    hireCost: 200,
    locked: true,
    questId: 'quest_grimjaw_redemption',
    minReputation: 50
  },
  {
    name: 'Lyssa Moonblade',
    race: 'sylvanborn',
    classId: 'ranger',
    sex: 'female',
    age: 112,
    origin: 'quest_ancient_hunter',
    portraitId: 'sylvanborn_ranger_female_1',
    baseStats: { STR: 14, DEX: 19, CON: 14, INT: 14, WIS: 17, CHA: 13 },
    skills: ['master_archery', 'nature_bond', 'ambush'],
    traits: ['ancient', 'wise', 'deadly'],
    upkeep: 28,
    hireCost: 250,
    locked: true,
    questId: 'quest_moonblade_pact'
  }
];

/**
 * Generate recruit pool for a region using deterministic seed
 */
export function generateRecruitPool(
  regionId: string,
  day: number,
  seed: string,
  config: RecruitSpawnConfig
): RecruitDef[] {
  const rng = new SeededRandom(`${seed}_recruits_${regionId}_${day}`);
  const pool: RecruitDef[] = [];

  // Shuffle templates for variety
  const shuffled = [...RECRUIT_TEMPLATES].sort(() => rng.nextFloat() - 0.5);

  for (let i = 0; i < Math.min(config.poolSize, shuffled.length); i++) {
    const template = shuffled[i];

    // Skip locked recruits if not unlocked (would check game state in real impl)
    // For now, include 20% chance of locked recruits appearing
    if (template.locked && rng.nextFloat() > 0.2) {
      continue;
    }

    // Generate level within tier range
    const level = rng.nextInt(config.minLevel, config.maxLevel);

    // Apply cost multiplier
    const upkeep = Math.round(template.upkeep * config.costMultiplier);
    const hireCost = Math.round(template.hireCost * config.costMultiplier);

    pool.push({
      ...template,
      id: `recruit_${regionId}_${template.name.replace(/\s/g, '_')}_${day}`,
      level,
      upkeep,
      hireCost
    });
  }

  return pool;
}

/**
 * Get spawn config for region tier
 */
export function getRegionSpawnConfig(tier: number): RecruitSpawnConfig {
  switch (tier) {
    case 1: // Starting regions
      return {
        regionTier: 1,
        minLevel: 1,
        maxLevel: 3,
        poolSize: 4,
        costMultiplier: 0.8
      };
    case 2: // Mid-tier regions
      return {
        regionTier: 2,
        minLevel: 3,
        maxLevel: 6,
        poolSize: 5,
        costMultiplier: 1.0
      };
    case 3: // Advanced regions
      return {
        regionTier: 3,
        minLevel: 5,
        maxLevel: 9,
        poolSize: 6,
        costMultiplier: 1.3
      };
    case 4: // High-tier regions
      return {
        regionTier: 4,
        minLevel: 8,
        maxLevel: 12,
        poolSize: 6,
        costMultiplier: 1.6
      };
    case 5: // Elite regions
      return {
        regionTier: 5,
        minLevel: 10,
        maxLevel: 15,
        poolSize: 8,
        costMultiplier: 2.0
      };
    default:
      return getRegionSpawnConfig(1);
  }
}

/**
 * Get recruit template by name (for testing/debug)
 */
export function getRecruitTemplate(name: string): Omit<RecruitDef, 'id' | 'level'> | undefined {
  return RECRUIT_TEMPLATES.find(t => t.name === name);
}

/**
 * Get all recruit templates
 */
export function getAllRecruitTemplates(): ReadonlyArray<Omit<RecruitDef, 'id' | 'level'>> {
  return RECRUIT_TEMPLATES;
}
