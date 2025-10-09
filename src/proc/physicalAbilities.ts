/**
 * Physical Abilities System
 * 
 * A comprehensive system for martial techniques, combat maneuvers, and athletic feats
 * that mirrors the magical spell system but focuses on physical prowess.
 */

import { SeededRandom } from './noise';

export type PhysicalAbilitySchool =
  | 'Weaponmastery'    // Sword techniques, bow mastery, weapon expertise
  | 'Combat'           // Hand-to-hand combat, grappling, unarmed strikes  
  | 'Athletics'        // Parkour, climbing, acrobatics, endurance
  | 'Tactics'          // Military formations, leadership, strategy
  | 'Survival'         // Tracking, foraging, wilderness skills
  | 'Stealth'          // Infiltration, lockpicking, assassination
  | 'Defense'          // Shield techniques, armor mastery, protection
  | 'Berserker';       // Rage, fury, primal combat techniques

export type PhysicalAbilityTier = 'Novice' | 'Adept' | 'Expert' | 'Master' | 'Legendary';

export interface PhysicalAbility {
  name: string;
  school: PhysicalAbilitySchool;
  tier: PhysicalAbilityTier;
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
    prerequisiteAbilities?: string[];
    requiredEquipment?: string[];
  };
  effects: {
    damage?: { min: number; max: number; type?: string };
    healing?: { min: number; max: number };
    buff?: { stat: string; modifier: number; duration?: number };
    special?: string[];
  };
  staminaCost: number;
  cooldown?: number; // in rounds or minutes
  range?: 'self' | 'touch' | 'near' | 'far';
}

export class PhysicalAbilitiesGenerator {
  private rng: SeededRandom;

  // Predefined ability templates organized by school
  private static readonly ABILITY_TEMPLATES: Record<PhysicalAbilitySchool, {
    [_key in PhysicalAbilityTier]: Array<Omit<PhysicalAbility, 'name' | 'school' | 'tier'>>
  }> = {
      Weaponmastery: {
        Novice: [
          {
            description: 'A basic sword technique that strikes with improved accuracy.',
            requirements: { minLevel: 1, requiredStats: { strength: 12 }, requiredEquipment: ['sword'] },
            effects: { damage: { min: 2, max: 6, type: 'slashing' } },
            staminaCost: 2,
            range: 'touch'
          },
          {
            description: 'Precise bow shot that rarely misses its target.',
            requirements: { minLevel: 1, requiredStats: { dexterity: 12 }, requiredEquipment: ['bow'] },
            effects: { damage: { min: 3, max: 5, type: 'piercing' } },
            staminaCost: 1,
            range: 'far'
          },
          {
            description: 'Quick flourish that intimidates opponents.',
            requirements: { minLevel: 2, requiredStats: { dexterity: 10, charisma: 10 } },
            effects: { special: ['intimidate', 'initiative_bonus'] },
            staminaCost: 1,
            range: 'near'
          }
        ],
        Adept: [
          {
            description: 'A spinning attack that strikes multiple nearby enemies.',
            requirements: { minLevel: 4, requiredStats: { strength: 14, dexterity: 12 } },
            effects: { damage: { min: 4, max: 8, type: 'slashing' }, special: ['cleave'] },
            staminaCost: 4,
            range: 'near'
          },
          {
            description: 'Twin-strike technique for dual-wielding weapons.',
            requirements: { minLevel: 5, requiredStats: { dexterity: 15 }, prerequisiteAbilities: ['Basic Strike'] },
            effects: { damage: { min: 3, max: 6 }, special: ['double_attack'] },
            staminaCost: 5,
            range: 'touch'
          }
        ],
        Expert: [
          {
            description: 'Devastating overhead strike that can cleave through armor.',
            requirements: { minLevel: 8, requiredStats: { strength: 16 } },
            effects: { damage: { min: 8, max: 15, type: 'slashing' }, special: ['armor_pierce'] },
            staminaCost: 8,
            cooldown: 3,
            range: 'touch'
          }
        ],
        Master: [
          {
            description: 'Legendary sword technique that can cut through multiple foes in a single motion.',
            requirements: { minLevel: 12, requiredStats: { strength: 18, dexterity: 16 } },
            effects: { damage: { min: 12, max: 20, type: 'slashing' }, special: ['chain_attack', 'armor_pierce'] },
            staminaCost: 12,
            cooldown: 5,
            range: 'near'
          }
        ],
        Legendary: [
          {
            description: 'The ultimate expression of weapon mastery, a technique that transcends mortal limits.',
            requirements: { minLevel: 18, requiredStats: { strength: 20, dexterity: 18 } },
            effects: { damage: { min: 20, max: 35, type: 'slashing' }, special: ['perfect_strike', 'ignore_armor', 'cleave_all'] },
            staminaCost: 20,
            cooldown: 10,
            range: 'far'
          }
        ]
      },

      Combat: {
        Novice: [
          {
            description: 'Basic unarmed strike enhanced by training.',
            requirements: { minLevel: 1, requiredStats: { strength: 10 } },
            effects: { damage: { min: 1, max: 4, type: 'bludgeoning' } },
            staminaCost: 1,
            range: 'touch'
          },
          {
            description: 'Simple grappling technique to restrain opponents.',
            requirements: { minLevel: 2, requiredStats: { strength: 12, dexterity: 10 } },
            effects: { special: ['grapple', 'restrain'] },
            staminaCost: 3,
            range: 'touch'
          }
        ],
        Adept: [
          {
            description: 'Stunning blow that can daze enemies.',
            requirements: { minLevel: 4, requiredStats: { strength: 13, constitution: 12 } },
            effects: { damage: { min: 3, max: 6, type: 'bludgeoning' }, special: ['stun'] },
            staminaCost: 4,
            range: 'touch'
          },
          {
            description: 'Counter-attack that triggers when enemies miss.',
            requirements: { minLevel: 5, requiredStats: { dexterity: 14, wisdom: 12 } },
            effects: { damage: { min: 2, max: 5 }, special: ['counter', 'reactive'] },
            staminaCost: 0,
            range: 'touch'
          }
        ],
        Expert: [
          {
            description: 'Devastating combination of strikes that builds momentum.',
            requirements: { minLevel: 8, requiredStats: { strength: 15, dexterity: 15 } },
            effects: { damage: { min: 6, max: 12, type: 'bludgeoning' }, special: ['combo', 'momentum'] },
            staminaCost: 7,
            range: 'touch'
          }
        ],
        Master: [
          {
            description: 'Perfect martial arts technique that flows like water.',
            requirements: { minLevel: 12, requiredStats: { strength: 16, dexterity: 18, wisdom: 15 } },
            effects: { damage: { min: 10, max: 18, type: 'force' }, special: ['flowing_strike', 'unblockable'] },
            staminaCost: 10,
            cooldown: 4,
            range: 'touch'
          }
        ],
        Legendary: [
          {
            description: 'Transcendent fighting technique that channels inner power.',
            requirements: { minLevel: 18, requiredStats: { strength: 18, dexterity: 20, wisdom: 18 } },
            effects: { damage: { min: 18, max: 30, type: 'force' }, special: ['ki_strike', 'ignore_armor', 'heal_self'] },
            staminaCost: 15,
            cooldown: 8,
            range: 'near'
          }
        ]
      },

      Athletics: {
        Novice: [
          {
            description: 'Enhanced climbing ability for scaling walls and cliffs.',
            requirements: { minLevel: 1, requiredStats: { strength: 10, dexterity: 10 } },
            effects: { special: ['climb_speed', 'sure_grip'] },
            staminaCost: 2,
            range: 'self'
          },
          {
            description: 'Improved jumping distance and height.',
            requirements: { minLevel: 1, requiredStats: { strength: 11 } },
            effects: { special: ['long_jump', 'high_jump'] },
            staminaCost: 1,
            range: 'self'
          }
        ],
        Adept: [
          {
            description: 'Parkour techniques for rapid urban movement.',
            requirements: { minLevel: 4, requiredStats: { dexterity: 14, constitution: 12 } },
            effects: { special: ['wall_run', 'fast_movement', 'obstacle_ignore'] },
            staminaCost: 3,
            range: 'self'
          },
          {
            description: 'Enhanced endurance for long-distance activities.',
            requirements: { minLevel: 3, requiredStats: { constitution: 14 } },
            effects: { buff: { stat: 'stamina_regen', modifier: 2 } },
            staminaCost: 0,
            range: 'self'
          }
        ],
        Expert: [
          {
            description: 'Acrobatic maneuvers that help avoid attacks.',
            requirements: { minLevel: 7, requiredStats: { dexterity: 16, constitution: 13 } },
            effects: { special: ['evasion_boost', 'acrobatic_dodge', 'fall_immunity'] },
            staminaCost: 5,
            range: 'self'
          }
        ],
        Master: [
          {
            description: 'Superhuman athletic ability that defies normal limits.',
            requirements: { minLevel: 11, requiredStats: { strength: 16, dexterity: 17, constitution: 16 } },
            effects: { special: ['perfect_balance', 'superhuman_speed', 'tireless'] },
            staminaCost: 8,
            range: 'self'
          }
        ],
        Legendary: [
          {
            description: 'Legendary athletic prowess that approaches the mythical.',
            requirements: { minLevel: 16, requiredStats: { strength: 18, dexterity: 20, constitution: 18 } },
            effects: { special: ['legendary_speed', 'physics_defying', 'unstoppable_momentum'] },
            staminaCost: 12,
            cooldown: 6,
            range: 'self'
          }
        ]
      },

      Tactics: {
        Novice: [
          {
            description: 'Basic leadership that inspires nearby allies.',
            requirements: { minLevel: 2, requiredStats: { intelligence: 12, charisma: 11 } },
            effects: { buff: { stat: 'morale', modifier: 1 }, special: ['inspire'] },
            staminaCost: 2,
            range: 'near'
          },
          {
            description: 'Tactical assessment of battlefield conditions.',
            requirements: { minLevel: 1, requiredStats: { intelligence: 13, wisdom: 10 } },
            effects: { special: ['battle_awareness', 'enemy_analysis'] },
            staminaCost: 1,
            range: 'far'
          }
        ],
        Adept: [
          {
            description: 'Coordinated attack with allies for increased effectiveness.',
            requirements: { minLevel: 5, requiredStats: { intelligence: 14, charisma: 12 } },
            effects: { damage: { min: 0, max: 0 }, special: ['coordinated_attack', 'ally_bonus'] },
            staminaCost: 4,
            range: 'near'
          },
          {
            description: 'Defensive formation that protects the group.',
            requirements: { minLevel: 4, requiredStats: { intelligence: 13, constitution: 12 } },
            effects: { special: ['formation_defense', 'damage_reduction'] },
            staminaCost: 3,
            range: 'near'
          }
        ],
        Expert: [
          {
            description: 'Advanced battlefield strategy that confuses enemies.',
            requirements: { minLevel: 8, requiredStats: { intelligence: 16, wisdom: 14 } },
            effects: { special: ['strategic_advantage', 'enemy_confusion', 'initiative_control'] },
            staminaCost: 6,
            range: 'far'
          }
        ],
        Master: [
          {
            description: 'Masterful tactical command that turns the tide of battle.',
            requirements: { minLevel: 12, requiredStats: { intelligence: 18, charisma: 16, wisdom: 15 } },
            effects: { special: ['battle_mastery', 'ally_coordination', 'enemy_disruption'] },
            staminaCost: 10,
            cooldown: 5,
            range: 'far'
          }
        ],
        Legendary: [
          {
            description: 'Legendary generalship that can win battles against impossible odds.',
            requirements: { minLevel: 17, requiredStats: { intelligence: 20, charisma: 18, wisdom: 17 } },
            effects: { special: ['legendary_tactics', 'army_inspiration', 'victory_inevitable'] },
            staminaCost: 15,
            cooldown: 10,
            range: 'far'
          }
        ]
      },

      Survival: {
        Novice: [
          {
            description: 'Basic tracking skills for following creatures and people.',
            requirements: { minLevel: 1, requiredStats: { wisdom: 12, intelligence: 10 } },
            effects: { special: ['track', 'identify_creatures'] },
            staminaCost: 1,
            range: 'far'
          },
          {
            description: 'Foraging ability to find food and water in the wilderness.',
            requirements: { minLevel: 1, requiredStats: { wisdom: 13, constitution: 10 } },
            effects: { special: ['forage', 'identify_plants'] },
            staminaCost: 2,
            range: 'near'
          }
        ],
        Adept: [
          {
            description: 'Advanced wilderness navigation that prevents getting lost.',
            requirements: { minLevel: 4, requiredStats: { wisdom: 14, intelligence: 12 } },
            effects: { special: ['never_lost', 'weather_prediction', 'shortcut_finding'] },
            staminaCost: 2,
            range: 'self'
          },
          {
            description: 'Animal communication for basic interaction with beasts.',
            requirements: { minLevel: 5, requiredStats: { wisdom: 15, charisma: 12 } },
            effects: { special: ['animal_speech', 'beast_friendship', 'mount_training'] },
            staminaCost: 3,
            range: 'near'
          }
        ],
        Expert: [
          {
            description: 'Master tracker who can follow days-old trails.',
            requirements: { minLevel: 8, requiredStats: { wisdom: 16, constitution: 13 } },
            effects: { special: ['master_tracking', 'scent_trail', 'predict_movement'] },
            staminaCost: 4,
            range: 'far'
          }
        ],
        Master: [
          {
            description: 'Legendary survival skills that allow thriving in any environment.',
            requirements: { minLevel: 12, requiredStats: { wisdom: 18, constitution: 16, intelligence: 14 } },
            effects: { special: ['environmental_adaptation', 'weather_immunity', 'resource_mastery'] },
            staminaCost: 6,
            range: 'self'
          }
        ],
        Legendary: [
          {
            description: 'Mythical connection to nature that grants supernatural survival abilities.',
            requirements: { minLevel: 16, requiredStats: { wisdom: 20, constitution: 18, charisma: 16 } },
            effects: { special: ['nature_bond', 'elemental_resistance', 'wilderness_mastery'] },
            staminaCost: 10,
            cooldown: 8,
            range: 'far'
          }
        ]
      },

      Stealth: {
        Novice: [
          {
            description: 'Basic stealth techniques for moving unseen.',
            requirements: { minLevel: 1, requiredStats: { dexterity: 12 } },
            effects: { special: ['hide', 'move_silently'] },
            staminaCost: 2,
            range: 'self'
          },
          {
            description: 'Simple lockpicking for basic locks and traps.',
            requirements: { minLevel: 2, requiredStats: { dexterity: 13, intelligence: 10 } },
            effects: { special: ['lockpick', 'disable_trap'] },
            staminaCost: 1,
            range: 'touch'
          }
        ],
        Adept: [
          {
            description: 'Advanced stealth that works even in broad daylight.',
            requirements: { minLevel: 4, requiredStats: { dexterity: 15, wisdom: 12 } },
            effects: { special: ['invisibility', 'shadow_step', 'crowd_blend'] },
            staminaCost: 4,
            range: 'self'
          },
          {
            description: 'Sneak attack that deals extra damage from hiding.',
            requirements: { minLevel: 5, requiredStats: { dexterity: 14, strength: 11 } },
            effects: { damage: { min: 6, max: 12, type: 'piercing' }, special: ['sneak_attack'] },
            staminaCost: 3,
            range: 'touch'
          }
        ],
        Expert: [
          {
            description: 'Master infiltration techniques for bypassing security.',
            requirements: { minLevel: 8, requiredStats: { dexterity: 17, intelligence: 14 } },
            effects: { special: ['master_infiltration', 'security_bypass', 'disguise'] },
            staminaCost: 6,
            range: 'self'
          }
        ],
        Master: [
          {
            description: 'Legendary stealth that approaches true invisibility.',
            requirements: { minLevel: 12, requiredStats: { dexterity: 19, wisdom: 15, intelligence: 14 } },
            effects: { special: ['perfect_stealth', 'phase_walk', 'memory_erase'] },
            staminaCost: 10,
            cooldown: 4,
            range: 'self'
          }
        ],
        Legendary: [
          {
            description: 'Mythical assassination technique that can kill with a single touch.',
            requirements: { minLevel: 17, requiredStats: { dexterity: 20, wisdom: 17, intelligence: 16 } },
            effects: { damage: { min: 50, max: 100, type: 'death' }, special: ['death_strike', 'untraceable', 'shadow_mastery'] },
            staminaCost: 20,
            cooldown: 15,
            range: 'touch'
          }
        ]
      },

      Defense: {
        Novice: [
          {
            description: 'Basic shield blocking technique.',
            requirements: { minLevel: 1, requiredStats: { strength: 11, constitution: 10 }, requiredEquipment: ['shield'] },
            effects: { special: ['block', 'damage_reduction_2'] },
            staminaCost: 1,
            range: 'self'
          },
          {
            description: 'Defensive stance that reduces incoming damage.',
            requirements: { minLevel: 2, requiredStats: { constitution: 12 } },
            effects: { special: ['defensive_stance', 'damage_reduction_3'] },
            staminaCost: 2,
            range: 'self'
          }
        ],
        Adept: [
          {
            description: 'Shield bash that can stun opponents while defending.',
            requirements: { minLevel: 4, requiredStats: { strength: 13, constitution: 12 }, requiredEquipment: ['shield'] },
            effects: { damage: { min: 2, max: 5, type: 'bludgeoning' }, special: ['stun', 'knockback'] },
            staminaCost: 3,
            range: 'touch'
          },
          {
            description: 'Armor expertise that improves protection effectiveness.',
            requirements: { minLevel: 5, requiredStats: { constitution: 14, intelligence: 11 } },
            effects: { special: ['armor_mastery', 'damage_reduction_5'] },
            staminaCost: 0,
            range: 'self'
          }
        ],
        Expert: [
          {
            description: 'Perfect parry that reflects attacks back at enemies.',
            requirements: { minLevel: 8, requiredStats: { dexterity: 16, constitution: 14 } },
            effects: { special: ['perfect_parry', 'reflect_damage', 'counter_attack'] },
            staminaCost: 5,
            range: 'self'
          }
        ],
        Master: [
          {
            description: 'Legendary defense that makes the user nearly invulnerable.',
            requirements: { minLevel: 12, requiredStats: { constitution: 18, strength: 15, dexterity: 15 } },
            effects: { special: ['legendary_defense', 'damage_immunity', 'aegis_aura'] },
            staminaCost: 12,
            cooldown: 6,
            range: 'self'
          }
        ],
        Legendary: [
          {
            description: 'Mythical protection that extends to allies and can turn the tide of battle.',
            requirements: { minLevel: 16, requiredStats: { constitution: 20, strength: 17, charisma: 16 } },
            effects: { special: ['divine_protection', 'ally_immunity', 'battlefield_aegis'] },
            staminaCost: 18,
            cooldown: 12,
            range: 'far'
          }
        ]
      },

      Berserker: {
        Novice: [
          {
            description: 'Basic rage that increases damage but reduces defense.',
            requirements: { minLevel: 2, requiredStats: { strength: 12, constitution: 11 } },
            effects: { buff: { stat: 'damage', modifier: 3 }, special: ['rage', 'defense_penalty'] },
            staminaCost: 3,
            range: 'self'
          },
          {
            description: 'Intimidating roar that frightens nearby enemies.',
            requirements: { minLevel: 1, requiredStats: { strength: 11, charisma: 10 } },
            effects: { special: ['fear', 'intimidate', 'morale_damage'] },
            staminaCost: 2,
            range: 'near'
          }
        ],
        Adept: [
          {
            description: 'Berserker frenzy that allows multiple attacks.',
            requirements: { minLevel: 5, requiredStats: { strength: 14, constitution: 13 } },
            effects: { damage: { min: 4, max: 8 }, special: ['frenzy', 'extra_attacks', 'pain_ignore'] },
            staminaCost: 6,
            range: 'self'
          },
          {
            description: 'Unstoppable charge that breaks through enemy lines.',
            requirements: { minLevel: 4, requiredStats: { strength: 13, constitution: 12 } },
            effects: { damage: { min: 6, max: 10, type: 'bludgeoning' }, special: ['charge', 'knockdown', 'breakthrough'] },
            staminaCost: 4,
            range: 'near'
          }
        ],
        Expert: [
          {
            description: 'Primal fury that grows stronger as health decreases.',
            requirements: { minLevel: 8, requiredStats: { strength: 16, constitution: 15 } },
            effects: { special: ['primal_fury', 'escalating_rage', 'death_resistance'] },
            staminaCost: 8,
            range: 'self'
          }
        ],
        Master: [
          {
            description: 'Legendary berserker state that makes one nearly unstoppable.',
            requirements: { minLevel: 12, requiredStats: { strength: 18, constitution: 17 } },
            effects: { damage: { min: 15, max: 25 }, special: ['legendary_rage', 'unstoppable', 'fear_immunity'] },
            staminaCost: 15,
            cooldown: 8,
            range: 'self'
          }
        ],
        Legendary: [
          {
            description: 'Mythical warrior state that channels primal forces of destruction.',
            requirements: { minLevel: 17, requiredStats: { strength: 20, constitution: 19 } },
            effects: { damage: { min: 25, max: 40 }, special: ['apocalyptic_rage', 'area_destruction', 'immortal_fury'] },
            staminaCost: 25,
            cooldown: 15,
            range: 'far'
          }
        ]
      }
    };

  constructor(seed: string) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Generate a random physical ability of specified school and tier
   */
  generateAbility(school: PhysicalAbilitySchool, tier: PhysicalAbilityTier): PhysicalAbility {
    const templates = PhysicalAbilitiesGenerator.ABILITY_TEMPLATES[school][tier];
    if (!templates || templates.length === 0) {
      throw new Error(`No templates found for ${school} ${tier}`);
    }

    const template = this.rng.pick(templates);
    const name = this.generateAbilityName(school, tier);

    return {
      name,
      school,
      tier,
      ...template
    };
  }

  /**
   * Generate a thematic name for a physical ability
   */
  private generateAbilityName(school: PhysicalAbilitySchool, tier: PhysicalAbilityTier): string {
    const tierPrefixes: Record<PhysicalAbilityTier, string[]> = {
      Novice: ['Basic', 'Simple', 'Student\'s', 'Apprentice', 'Training'],
      Adept: ['Skilled', 'Practiced', 'Advanced', 'Refined', 'Improved'],
      Expert: ['Master', 'Superior', 'Perfect', 'Elite', 'Exceptional'],
      Master: ['Grand', 'Supreme', 'Ultimate', 'Legendary', 'Transcendent'],
      Legendary: ['Mythical', 'Divine', 'Eternal', 'Cosmic', 'Godlike']
    };

    const schoolTerms: Record<PhysicalAbilitySchool, string[]> = {
      Weaponmastery: ['Strike', 'Slash', 'Thrust', 'Cut', 'Blade Dance', 'Steel Song', 'Edge Mastery'],
      Combat: ['Fist', 'Punch', 'Grapple', 'Throw', 'Counter', 'Fighting Form', 'Combat Style'],
      Athletics: ['Leap', 'Sprint', 'Climb', 'Jump', 'Dash', 'Athletic Form', 'Body Control'],
      Tactics: ['Strategy', 'Formation', 'Command', 'Leadership', 'Battle Plan', 'War Art'],
      Survival: ['Track', 'Hunt', 'Navigate', 'Forage', 'Wilderness Way', 'Nature Bond'],
      Stealth: ['Shadow', 'Sneak', 'Hide', 'Infiltrate', 'Silent Step', 'Phantom Move'],
      Defense: ['Block', 'Guard', 'Shield', 'Protect', 'Aegis', 'Fortress Stance'],
      Berserker: ['Rage', 'Fury', 'Wrath', 'Frenzy', 'Berserker', 'Primal Scream']
    };

    const prefix = this.rng.pick(tierPrefixes[tier]);
    const term = this.rng.pick(schoolTerms[school]);

    return `${prefix} ${term}`;
  }

  /**
   * Get all available physical abilities for a given character level and stats
   */
  getAvailableAbilities(
    level: number,
    stats: Record<string, number>,
    equipment: string[] = [],
    knownAbilities: string[] = []
  ): PhysicalAbility[] {
    const available: PhysicalAbility[] = [];

    for (const school of Object.keys(PhysicalAbilitiesGenerator.ABILITY_TEMPLATES) as PhysicalAbilitySchool[]) {
      for (const tier of Object.keys(PhysicalAbilitiesGenerator.ABILITY_TEMPLATES[school]) as PhysicalAbilityTier[]) {
        const templates = PhysicalAbilitiesGenerator.ABILITY_TEMPLATES[school][tier];

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

          // Check equipment requirements
          if (template.requirements.requiredEquipment) {
            const hasRequired = template.requirements.requiredEquipment.every(req =>
              equipment.some(item => item.toLowerCase().includes(req.toLowerCase()))
            );
            if (!hasRequired) continue;
          }

          // Check prerequisite abilities
          if (template.requirements.prerequisiteAbilities) {
            const hasPrerequisites = template.requirements.prerequisiteAbilities.every(prereq =>
              knownAbilities.includes(prereq)
            );
            if (!hasPrerequisites) continue;
          }

          // Generate the ability
          const ability = this.generateAbility(school, tier);
          available.push(ability);
        }
      }
    }

    return available;
  }

  /**
   * Generate ability names for different difficulty levels (for rewards)
   */
  generateAbilityScroll(difficulty: number): { name: string; description: string } {
    const tier: PhysicalAbilityTier =
      difficulty >= 9 ? 'Legendary' :
        difficulty >= 7 ? 'Master' :
          difficulty >= 5 ? 'Expert' :
            difficulty >= 3 ? 'Adept' : 'Novice';

    const schools = Object.keys(PhysicalAbilitiesGenerator.ABILITY_TEMPLATES) as PhysicalAbilitySchool[];
    const school = this.rng.pick(schools);

    const name = this.generateAbilityName(school, tier);

    return {
      name: `${name} Manual`,
      description: `A training manual that teaches the ${name} technique from the ${school} discipline.`
    };
  }
}