/**
 * Magical Abilities System
 * 
 * A comprehensive system for spells, enchantments, and magical techniques
 * that complements the physical abilities system but focuses on mystical powers.
 */

import { SeededRandom } from './noise';

export type MagicalSchool =
  | 'Evocation'        // Elemental magic, damage spells, energy manipulation
  | 'Enchantment'      // Buffs, debuffs, mental effects, charm magic
  | 'Transmutation'    // Shape-changing, material transformation, alchemy
  | 'Divination'       // Scrying, detection, foresight, information magic
  | 'Conjuration'      // Summoning, teleportation, creation magic
  | 'Necromancy'       // Death magic, undead, life drain, soul manipulation
  | 'Illusion'         // Deception, invisibility, phantasms, mind tricks
  | 'Abjuration';      // Protection, dispelling, barriers, warding magic

export type SpellTier = 'Cantrip' | 'Apprentice' | 'Adept' | 'Master' | 'Archmage';

export interface MagicalSpell {
  name: string;
  school: MagicalSchool;
  tier: SpellTier;
  description: string;
  requirements: {
    minLevel: number;
    requiredStats: Partial<{
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    }>;
    prerequisiteSpells?: string[];
    requiredComponents?: string[];
  };
  effects: {
    damage?: { min: number; max: number; type?: string };
    healing?: { min: number; max: number };
    buff?: { stat: string; modifier: number; duration?: number };
    special?: string[];
  };
  etherCost: number;
  castTime?: number; // in rounds or seconds
  range?: 'self' | 'touch' | 'near' | 'far' | 'sight';
  duration?: number; // in minutes/hours for buffs
}

export class MagicalSpellsGenerator {
  private rng: SeededRandom;

  // Predefined spell templates organized by school
  private static readonly SPELL_TEMPLATES: Record<MagicalSchool, {
    [_key in SpellTier]: Array<Omit<MagicalSpell, 'name' | 'school' | 'tier'>>
  }> = {
      Evocation: {
        Cantrip: [
          {
            description: 'A small spark of flame that can light candles or deal minor damage.',
            requirements: { minLevel: 1, requiredStats: { intelligence: 10 } },
            effects: { damage: { min: 1, max: 3, type: 'fire' } },
            etherCost: 1,
            range: 'near'
          },
          {
            description: 'A minor jolt of electricity that can shock enemies or power devices.',
            requirements: { minLevel: 1, requiredStats: { intelligence: 11 } },
            effects: { damage: { min: 1, max: 4, type: 'lightning' } },
            etherCost: 1,
            range: 'touch'
          }
        ],
        Apprentice: [
          {
            description: 'A bolt of searing flame that burns enemies.',
            requirements: { minLevel: 3, requiredStats: { intelligence: 13 } },
            effects: { damage: { min: 4, max: 8, type: 'fire' } },
            etherCost: 3,
            range: 'far'
          },
          {
            description: 'Shards of ice that pierce through armor.',
            requirements: { minLevel: 3, requiredStats: { intelligence: 12, wisdom: 11 } },
            effects: { damage: { min: 3, max: 7, type: 'ice' }, special: ['armor_pierce'] },
            etherCost: 3,
            range: 'far'
          }
        ],
        Adept: [
          {
            description: 'A devastating explosion of elemental energy.',
            requirements: { minLevel: 6, requiredStats: { intelligence: 15 } },
            effects: { damage: { min: 8, max: 15, type: 'elemental' }, special: ['area_effect'] },
            etherCost: 6,
            range: 'far'
          }
        ],
        Master: [
          {
            description: 'A storm of pure elemental fury that devastates the battlefield.',
            requirements: { minLevel: 10, requiredStats: { intelligence: 17, wisdom: 14 } },
            effects: { damage: { min: 15, max: 25, type: 'elemental' }, special: ['area_effect', 'multi_element'] },
            etherCost: 12,
            range: 'sight'
          }
        ],
        Archmage: [
          {
            description: 'The ultimate expression of destructive magic, reshaping reality itself.',
            requirements: { minLevel: 15, requiredStats: { intelligence: 20, wisdom: 16 } },
            effects: { damage: { min: 25, max: 40, type: 'reality' }, special: ['reality_warp', 'unstoppable'] },
            etherCost: 20,
            range: 'sight'
          }
        ]
      },

      Enchantment: {
        Cantrip: [
          {
            description: 'Enhances the caster\'s natural abilities temporarily.',
            requirements: { minLevel: 1, requiredStats: { charisma: 11 } },
            effects: { buff: { stat: 'all_stats', modifier: 1, duration: 10 } },
            etherCost: 1,
            range: 'self'
          }
        ],
        Apprentice: [
          {
            description: 'Grants supernatural strength to the target.',
            requirements: { minLevel: 3, requiredStats: { charisma: 13, intelligence: 11 } },
            effects: { buff: { stat: 'strength', modifier: 3, duration: 30 } },
            etherCost: 3,
            range: 'touch'
          },
          {
            description: 'Enhances the target\'s reflexes and agility.',
            requirements: { minLevel: 3, requiredStats: { charisma: 12, dexterity: 12 } },
            effects: { buff: { stat: 'dexterity', modifier: 3, duration: 30 } },
            etherCost: 3,
            range: 'touch'
          }
        ],
        Adept: [
          {
            description: 'Provides comprehensive enhancement to all physical capabilities.',
            requirements: { minLevel: 6, requiredStats: { charisma: 15, intelligence: 13 } },
            effects: { buff: { stat: 'all_stats', modifier: 2, duration: 60 } },
            etherCost: 6,
            range: 'near'
          }
        ],
        Master: [
          {
            description: 'Grants legendary abilities that transcend normal limitations.',
            requirements: { minLevel: 10, requiredStats: { charisma: 17, intelligence: 15 } },
            effects: { special: ['legendary_enhancement', 'stat_transcendence'] },
            etherCost: 12,
            duration: 120,
            range: 'near'
          }
        ],
        Archmage: [
          {
            description: 'Elevates the target to godlike levels of capability.',
            requirements: { minLevel: 15, requiredStats: { charisma: 20, intelligence: 18 } },
            effects: { special: ['divine_enhancement', 'reality_transcendence'] },
            etherCost: 20,
            duration: 180,
            range: 'sight'
          }
        ]
      },

      Transmutation: {
        Cantrip: [
          {
            description: 'Changes the basic properties of small objects.',
            requirements: { minLevel: 1, requiredStats: { intelligence: 12 } },
            effects: { special: ['minor_transmutation'] },
            etherCost: 1,
            range: 'touch'
          }
        ],
        Apprentice: [
          {
            description: 'Transforms basic materials into more valuable substances.',
            requirements: { minLevel: 4, requiredStats: { intelligence: 14, wisdom: 12 } },
            effects: { special: ['material_transformation'] },
            etherCost: 4,
            range: 'touch'
          }
        ],
        Adept: [
          {
            description: 'Alters the fundamental structure of objects and beings.',
            requirements: { minLevel: 7, requiredStats: { intelligence: 16, wisdom: 14 } },
            effects: { special: ['structural_alteration', 'living_transmutation'] },
            etherCost: 7,
            range: 'near'
          }
        ],
        Master: [
          {
            description: 'Completely reshapes matter according to the caster\'s will.',
            requirements: { minLevel: 11, requiredStats: { intelligence: 18, wisdom: 16 } },
            effects: { special: ['matter_mastery', 'form_transcendence'] },
            etherCost: 15,
            range: 'far'
          }
        ],
        Archmage: [
          {
            description: 'Controls the fundamental forces that shape reality itself.',
            requirements: { minLevel: 16, requiredStats: { intelligence: 20, wisdom: 19 } },
            effects: { special: ['reality_shaping', 'universal_transmutation'] },
            etherCost: 25,
            range: 'sight'
          }
        ]
      },

      Divination: {
        Cantrip: [
          {
            description: 'Reveals basic information about objects and creatures.',
            requirements: { minLevel: 1, requiredStats: { wisdom: 12 } },
            effects: { special: ['basic_detection'] },
            etherCost: 1,
            range: 'near'
          }
        ],
        Apprentice: [
          {
            description: 'Senses the presence of hidden things and creatures.',
            requirements: { minLevel: 3, requiredStats: { wisdom: 14, intelligence: 11 } },
            effects: { special: ['true_sight', 'hidden_detection'] },
            etherCost: 3,
            range: 'far'
          }
        ],
        Adept: [
          {
            description: 'Peer into the past and future to gain knowledge.',
            requirements: { minLevel: 6, requiredStats: { wisdom: 16, intelligence: 13 } },
            effects: { special: ['temporal_sight', 'knowledge_revelation'] },
            etherCost: 6,
            range: 'sight'
          }
        ],
        Master: [
          {
            description: 'Comprehends the deepest mysteries of existence.',
            requirements: { minLevel: 10, requiredStats: { wisdom: 18, intelligence: 16 } },
            effects: { special: ['cosmic_awareness', 'universal_knowledge'] },
            etherCost: 12,
            range: 'sight'
          }
        ],
        Archmage: [
          {
            description: 'Achieves perfect understanding of all things across all realities.',
            requirements: { minLevel: 15, requiredStats: { wisdom: 20, intelligence: 19 } },
            effects: { special: ['omniscience', 'reality_comprehension'] },
            etherCost: 20,
            range: 'sight'
          }
        ]
      },

      Conjuration: {
        Cantrip: [
          {
            description: 'Creates small objects from thin air.',
            requirements: { minLevel: 1, requiredStats: { intelligence: 11, charisma: 10 } },
            effects: { special: ['minor_creation'] },
            etherCost: 1,
            range: 'near'
          }
        ],
        Apprentice: [
          {
            description: 'Summons helpful creatures to aid in battle.',
            requirements: { minLevel: 3, requiredStats: { intelligence: 13, charisma: 12 } },
            effects: { special: ['summon_ally'] },
            etherCost: 4,
            range: 'near',
            duration: 60
          }
        ],
        Adept: [
          {
            description: 'Opens portals to distant locations for rapid travel.',
            requirements: { minLevel: 6, requiredStats: { intelligence: 15, wisdom: 13 } },
            effects: { special: ['teleportation', 'portal_creation'] },
            etherCost: 8,
            range: 'sight'
          }
        ],
        Master: [
          {
            description: 'Brings forth powerful entities from other planes.',
            requirements: { minLevel: 10, requiredStats: { intelligence: 17, charisma: 16 } },
            effects: { special: ['planar_summoning', 'entity_binding'] },
            etherCost: 15,
            range: 'far',
            duration: 120
          }
        ],
        Archmage: [
          {
            description: 'Commands the fundamental forces of creation itself.',
            requirements: { minLevel: 15, requiredStats: { intelligence: 19, charisma: 18, wisdom: 16 } },
            effects: { special: ['cosmic_creation', 'reality_summoning'] },
            etherCost: 25,
            range: 'sight',
            duration: 240
          }
        ]
      },

      Necromancy: {
        Cantrip: [
          {
            description: 'Drains a small amount of life force from enemies.',
            requirements: { minLevel: 1, requiredStats: { intelligence: 11, constitution: 10 } },
            effects: { damage: { min: 1, max: 2, type: 'necrotic' }, healing: { min: 1, max: 2 } },
            etherCost: 1,
            range: 'touch'
          }
        ],
        Apprentice: [
          {
            description: 'Animate the dead to serve as temporary minions.',
            requirements: { minLevel: 4, requiredStats: { intelligence: 13, constitution: 12 } },
            effects: { special: ['animate_dead'] },
            etherCost: 5,
            range: 'near',
            duration: 60
          }
        ],
        Adept: [
          {
            description: 'Steal years of life from enemies to extend your own.',
            requirements: { minLevel: 7, requiredStats: { intelligence: 15, constitution: 14 } },
            effects: { damage: { min: 8, max: 12, type: 'life_drain' }, healing: { min: 4, max: 6 } },
            etherCost: 8,
            range: 'far'
          }
        ],
        Master: [
          {
            description: 'Command over death itself, raising powerful undead servants.',
            requirements: { minLevel: 11, requiredStats: { intelligence: 17, constitution: 16 } },
            effects: { special: ['death_mastery', 'undead_legion'] },
            etherCost: 15,
            range: 'far',
            duration: 240
          }
        ],
        Archmage: [
          {
            description: 'Transcend the boundary between life and death.',
            requirements: { minLevel: 16, requiredStats: { intelligence: 19, constitution: 18 } },
            effects: { special: ['lichdom', 'death_transcendence', 'soul_mastery'] },
            etherCost: 30,
            range: 'sight'
          }
        ]
      },

      Illusion: {
        Cantrip: [
          {
            description: 'Create minor visual or auditory illusions.',
            requirements: { minLevel: 1, requiredStats: { intelligence: 10, charisma: 11 } },
            effects: { special: ['minor_illusion'] },
            etherCost: 1,
            range: 'near'
          }
        ],
        Apprentice: [
          {
            description: 'Become invisible to most forms of detection.',
            requirements: { minLevel: 3, requiredStats: { intelligence: 12, dexterity: 13 } },
            effects: { special: ['invisibility'] },
            etherCost: 4,
            range: 'self',
            duration: 30
          }
        ],
        Adept: [
          {
            description: 'Create complex illusions that can fool multiple senses.',
            requirements: { minLevel: 6, requiredStats: { intelligence: 15, charisma: 14 } },
            effects: { special: ['complex_illusion', 'mass_deception'] },
            etherCost: 7,
            range: 'far',
            duration: 60
          }
        ],
        Master: [
          {
            description: 'Bend reality to create illusions indistinguishable from truth.',
            requirements: { minLevel: 10, requiredStats: { intelligence: 17, charisma: 16, wisdom: 14 } },
            effects: { special: ['reality_illusion', 'truth_deception'] },
            etherCost: 12,
            range: 'sight',
            duration: 120
          }
        ],
        Archmage: [
          {
            description: 'Make illusions so perfect they become reality.',
            requirements: { minLevel: 15, requiredStats: { intelligence: 19, charisma: 18, wisdom: 17 } },
            effects: { special: ['illusion_reality', 'dream_manifestation'] },
            etherCost: 20,
            range: 'sight',
            duration: 300
          }
        ]
      },

      Abjuration: {
        Cantrip: [
          {
            description: 'Creates a small protective barrier against harm.',
            requirements: { minLevel: 1, requiredStats: { wisdom: 11, constitution: 10 } },
            effects: { special: ['minor_protection'] },
            etherCost: 1,
            range: 'self',
            duration: 10
          }
        ],
        Apprentice: [
          {
            description: 'Dispels hostile magical effects and enchantments.',
            requirements: { minLevel: 3, requiredStats: { wisdom: 13, intelligence: 11 } },
            effects: { special: ['dispel_magic'] },
            etherCost: 3,
            range: 'near'
          }
        ],
        Adept: [
          {
            description: 'Creates powerful wards that protect against multiple threats.',
            requirements: { minLevel: 6, requiredStats: { wisdom: 15, constitution: 13 } },
            effects: { special: ['greater_ward', 'multi_protection'] },
            etherCost: 6,
            range: 'near',
            duration: 120
          }
        ],
        Master: [
          {
            description: 'Establishes ultimate magical defenses that repel all harm.',
            requirements: { minLevel: 10, requiredStats: { wisdom: 17, constitution: 16, intelligence: 14 } },
            effects: { special: ['absolute_protection', 'harm_immunity'] },
            etherCost: 12,
            range: 'far',
            duration: 180
          }
        ],
        Archmage: [
          {
            description: 'Becomes untouchable by mortal means through perfect magical defense.',
            requirements: { minLevel: 15, requiredStats: { wisdom: 20, constitution: 18, intelligence: 17 } },
            effects: { special: ['divine_protection', 'reality_shield'] },
            etherCost: 20,
            range: 'sight',
            duration: 360
          }
        ]
      }
    };

  constructor(seed: string) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Generate a random magical spell of specified school and tier
   */
  generateSpell(school: MagicalSchool, tier: SpellTier): MagicalSpell {
    const templates = MagicalSpellsGenerator.SPELL_TEMPLATES[school][tier];
    if (!templates || templates.length === 0) {
      throw new Error(`No templates found for ${school} ${tier}`);
    }

    const template = this.rng.pick(templates);
    const name = this.generateSpellName(school, tier);

    return {
      name,
      school,
      tier,
      ...template
    };
  }

  /**
   * Generate a thematic name for a magical spell
   */
  private generateSpellName(school: MagicalSchool, tier: SpellTier): string {
    const tierPrefixes: Record<SpellTier, string[]> = {
      Cantrip: ['Minor', 'Lesser', 'Simple', 'Basic', 'Apprentice'],
      Apprentice: ['Improved', 'Enhanced', 'Refined', 'Focused', 'Practiced'],
      Adept: ['Greater', 'Superior', 'Advanced', 'Powerful', 'Mastered'],
      Master: ['Grand', 'Supreme', 'Ultimate', 'Perfect', 'Transcendent'],
      Archmage: ['Divine', 'Cosmic', 'Reality', 'Omnipotent', 'Godlike']
    };

    const schoolTerms: Record<MagicalSchool, string[]> = {
      Evocation: ['Bolt', 'Blast', 'Storm', 'Fury', 'Inferno', 'Lightning', 'Elemental Force'],
      Enchantment: ['Blessing', 'Enhancement', 'Charm', 'Empowerment', 'Inspiration', 'Might'],
      Transmutation: ['Transformation', 'Shaping', 'Alteration', 'Metamorphosis', 'Change', 'Form'],
      Divination: ['Sight', 'Vision', 'Revelation', 'Knowledge', 'Truth', 'Perception', 'Awareness'],
      Conjuration: ['Summoning', 'Creation', 'Manifestation', 'Portal', 'Gateway', 'Calling'],
      Necromancy: ['Drain', 'Death', 'Decay', 'Soul', 'Undeath', 'Corruption', 'Life Steal'],
      Illusion: ['Phantasm', 'Deception', 'Mirage', 'Dream', 'Shadow', 'Glamour', 'Trickery'],
      Abjuration: ['Ward', 'Shield', 'Barrier', 'Protection', 'Defense', 'Sanctuary', 'Aegis']
    };

    const prefix = this.rng.pick(tierPrefixes[tier]);
    const term = this.rng.pick(schoolTerms[school]);

    return `${prefix} ${term}`;
  }

  /**
   * Get all available magical spells for a given character level and stats
   */
  getAvailableSpells(
    level: number,
    stats: Record<string, number>,
    components: string[] = [],
    knownSpells: string[] = []
  ): MagicalSpell[] {
    const available: MagicalSpell[] = [];

    for (const school of Object.keys(MagicalSpellsGenerator.SPELL_TEMPLATES) as MagicalSchool[]) {
      for (const tier of Object.keys(MagicalSpellsGenerator.SPELL_TEMPLATES[school]) as SpellTier[]) {
        const templates = MagicalSpellsGenerator.SPELL_TEMPLATES[school][tier];

        for (const template of templates) {
          // Check level requirement
          if (level < template.requirements.minLevel) continue;

          // Check stat requirements
          let meetsStatRequirements = true;
          for (const [stat, required] of Object.entries(template.requirements.requiredStats || {})) {
            if ((stats[stat] || 0) < required) {
              meetsStatRequirements = false;
              break;
            }
          }
          if (!meetsStatRequirements) continue;

          // Check component requirements
          if (template.requirements.requiredComponents) {
            const hasRequired = template.requirements.requiredComponents.every(req =>
              components.some(comp => comp.toLowerCase().includes(req.toLowerCase()))
            );
            if (!hasRequired) continue;
          }

          // Check prerequisite spells
          if (template.requirements.prerequisiteSpells) {
            const hasPrerequisites = template.requirements.prerequisiteSpells.every(prereq =>
              knownSpells.includes(prereq)
            );
            if (!hasPrerequisites) continue;
          }

          // Generate the spell
          const spell = this.generateSpell(school, tier);
          available.push(spell);
        }
      }
    }

    return available;
  }

  /**
   * Generate spell names for different difficulty levels (for rewards)
   */
  generateSpellScroll(difficulty: number): { name: string; description: string } {
    const tier: SpellTier =
      difficulty >= 9 ? 'Archmage' :
        difficulty >= 7 ? 'Master' :
          difficulty >= 5 ? 'Adept' :
            difficulty >= 3 ? 'Apprentice' : 'Cantrip';

    const schools = Object.keys(MagicalSpellsGenerator.SPELL_TEMPLATES) as MagicalSchool[];
    const school = this.rng.pick(schools);

    const name = this.generateSpellName(school, tier);

    return {
      name: `${name} Scroll`,
      description: `A magical scroll containing the ${name} spell from the ${school} school of magic.`
    };
  }
}