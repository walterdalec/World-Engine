import React from 'react';

interface GeneratedSpell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  color: string;
}

// Curated premade spells for each school
export const PREMADE_SPELLS: { [school: string]: GeneratedSpell[] } = {
  abjuration: [
    // Cantrips
    {
      name: "Ward",
      level: 0,
      school: "Abjuration",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (protective word)", "S (warding gesture)"],
      duration: "1 round",
      description: "Creates a shimmering barrier that provides +1 AC against the next attack.",
      color: "#3b82f6"
    },
    {
      name: "Resist",
      level: 0,
      school: "Abjuration",
      castingTime: "1 reaction",
      range: "Self",
      components: ["V (quick incantation)"],
      duration: "Instantaneous",
      description: "Reduces incoming damage by 1d4 points when cast as a reaction.",
      color: "#3b82f6"
    },
    // Level 1
    {
      name: "Shield of Faith",
      level: 1,
      school: "Abjuration",
      castingTime: "1 action",
      range: "60 feet",
      components: ["V (prayer)", "S (blessing gesture)", "M (holy symbol)"],
      duration: "5 rounds",
      description: "Surrounds target with divine energy, granting +2 AC and resistance to the next spell.",
      color: "#3b82f6"
    },
    {
      name: "Dispel Minor Magic",
      level: 1,
      school: "Abjuration",
      castingTime: "1 action",
      range: "60 feet",
      components: ["V (dispelling word)", "S (dismissive gesture)"],
      duration: "Instantaneous",
      description: "Ends one cantrip or 1st level spell effect on target creature or object.",
      color: "#3b82f6"
    },
    // Level 2
    {
      name: "Arcane Lock",
      level: 2,
      school: "Abjuration",
      castingTime: "2 actions",
      range: "Touch",
      components: ["V (locking incantation)", "S (sealing motions)", "M (silver key worth 25 gp)"],
      duration: "Until dispelled",
      description: "Magically locks a door, chest, or portal. Only the caster or dispel magic can open it.",
      color: "#3b82f6"
    },
    // Level 3
    {
      name: "Greater Ward",
      level: 3,
      school: "Abjuration",
      castingTime: "1 action",
      range: "30 feet",
      components: ["V (protective chant)", "S (complex warding)", "M (crystal focus)"],
      duration: "10 rounds",
      description: "Creates a 15-foot radius protective dome. Allies inside gain damage resistance and spell immunity.",
      color: "#3b82f6"
    }
  ],

  conjuration: [
    // Cantrips
    {
      name: "Summon Spark",
      level: 0,
      school: "Conjuration",
      castingTime: "1 action",
      range: "60 feet",
      components: ["V (summoning word)", "S (beckoning gesture)"],
      duration: "1 round",
      description: "Creates a tiny mote of light that can illuminate or distract. Deals 1d4 radiant damage.",
      color: "#10b981"
    },
    // Level 1
    {
      name: "Conjure Weapon",
      level: 1,
      school: "Conjuration",
      castingTime: "1 action",
      range: "Self",
      components: ["V (weapon's name)", "S (grasping motion)"],
      duration: "5 rounds",
      description: "Creates a simple melee weapon in your hand. Weapon deals 1d6 + spell modifier damage.",
      color: "#10b981"
    },
    {
      name: "Faithful Hound",
      level: 1,
      school: "Conjuration",
      castingTime: "2 actions",
      range: "30 feet",
      components: ["V (calling howl)", "S (summoning ritual)", "M (dog whistle)"],
      duration: "10 rounds",
      description: "Summons a spectral hound with 15 HP that follows your commands and alerts to enemies.",
      color: "#10b981"
    },
    // Level 2
    {
      name: "Dimensional Door",
      level: 2,
      school: "Conjuration",
      castingTime: "1 action",
      range: "500 feet",
      components: ["V (travel word)", "S (stepping motion)"],
      duration: "Instantaneous",
      description: "Instantly teleports you and one willing ally to a location you can see within range.",
      color: "#10b981"
    }
  ],

  divination: [
    // Cantrips
    {
      name: "Detect",
      level: 0,
      school: "Divination",
      castingTime: "1 action",
      range: "30 feet",
      components: ["V (inquiry)", "S (searching gesture)"],
      duration: "3 rounds",
      description: "Reveals the presence of magic, hidden objects, or creatures within range.",
      color: "#f59e0b"
    },
    // Level 1
    {
      name: "True Sight",
      level: 1,
      school: "Divination",
      castingTime: "1 action",
      range: "Self",
      components: ["V (seeing word)", "S (eye-opening gesture)", "M (crystal lens)"],
      duration: "10 rounds",
      description: "See through illusions, detect invisible creatures, and perceive the true form of shapeshifters.",
      color: "#f59e0b"
    },
    {
      name: "Locate Object",
      level: 1,
      school: "Divination",
      castingTime: "2 actions",
      range: "1 mile",
      components: ["V (object's name)", "S (searching motions)", "M (lodestone)"],
      duration: "10 rounds",
      description: "Sense the direction and distance to a specific object you've seen before.",
      color: "#f59e0b"
    }
  ],

  enchantment: [
    // Cantrips
    {
      name: "Charm",
      level: 0,
      school: "Enchantment",
      castingTime: "1 action",
      range: "30 feet",
      components: ["V (persuasive words)", "S (friendly gesture)"],
      duration: "3 rounds",
      description: "Target views you as a friendly acquaintance. They won't attack you but aren't controlled.",
      color: "#ec4899"
    },
    // Level 1
    {
      name: "Command",
      level: 1,
      school: "Enchantment",
      castingTime: "1 action",
      range: "60 feet",
      components: ["V (single word command)"],
      duration: "1 round",
      description: "Target must obey a one-word command: Approach, Drop, Flee, Grovel, or Halt.",
      color: "#ec4899"
    },
    {
      name: "Sleep",
      level: 1,
      school: "Enchantment",
      castingTime: "1 action",
      range: "90 feet",
      components: ["V (lullaby)", "S (soothing gesture)", "M (sand or rose petals)"],
      duration: "5 rounds",
      description: "Creatures in 20-foot radius fall unconscious. Affects 5d8 hit points worth of creatures.",
      color: "#ec4899"
    }
  ],

  evocation: [
    // Cantrips
    {
      name: "Magic Missile",
      level: 0,
      school: "Evocation",
      castingTime: "1 action",
      range: "120 feet",
      components: ["V (targeting word)", "S (pointing gesture)"],
      duration: "Instantaneous",
      description: "Creates 1 dart of pure force that automatically hits for 1d4+1 damage.",
      color: "#ef4444"
    },
    {
      name: "Spark",
      level: 0,
      school: "Evocation",
      castingTime: "1 action",
      range: "60 feet",
      components: ["V (crackling word)", "S (snapping fingers)"],
      duration: "Instantaneous",
      description: "Target takes 1d6 lightning damage and must make a Constitution save or be stunned for 1 round.",
      color: "#ef4444"
    },
    // Level 1
    {
      name: "Burning Hands",
      level: 1,
      school: "Evocation",
      castingTime: "1 action",
      range: "15-foot cone",
      components: ["V (fiery incantation)", "S (spreading fingers)"],
      duration: "Instantaneous",
      description: "Flames shoot from your fingertips. Each creature in area takes 3d6 fire damage.",
      color: "#ef4444"
    },
    {
      name: "Lightning Bolt",
      level: 1,
      school: "Evocation",
      castingTime: "1 action",
      range: "100 feet",
      components: ["V (thunder word)", "S (throwing motion)", "M (copper wire)"],
      duration: "Instantaneous",
      description: "A bolt of lightning shoots in a line. Creatures in path take 2d8 lightning damage.",
      color: "#ef4444"
    }
  ],

  healing: [
    // Cantrips
    {
      name: "Mend Wounds",
      level: 0,
      school: "Healing",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (healing word)", "S (gentle touch)"],
      duration: "Instantaneous",
      description: "Restores 1d4 hit points to a living creature. Cannot heal the same target twice per combat.",
      color: "#22c55e"
    },
    {
      name: "Stabilize",
      level: 0,
      school: "Healing",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (life-binding word)", "S (steadying touch)"],
      duration: "Instantaneous",
      description: "A dying creature becomes stable and regains 1 hit point.",
      color: "#22c55e"
    },
    // Level 1
    {
      name: "Cure Light Wounds",
      level: 1,
      school: "Healing",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (healing prayer)", "S (laying on hands)"],
      duration: "Instantaneous",
      description: "Restores 1d8 + spellcasting modifier hit points to target creature.",
      color: "#22c55e"
    },
    {
      name: "Healing Word",
      level: 1,
      school: "Healing",
      castingTime: "1 bonus action",
      range: "60 feet",
      components: ["V (word of healing)"],
      duration: "Instantaneous",
      description: "Restores 1d4 + spellcasting modifier hit points. Can revive unconscious allies.",
      color: "#22c55e"
    },
    // Level 2
    {
      name: "Prayer of Healing",
      level: 2,
      school: "Healing",
      castingTime: "3 actions",
      range: "30-foot radius",
      components: ["V (group prayer)", "S (blessing gestures)", "M (holy symbol)"],
      duration: "Instantaneous",
      description: "Up to 6 creatures regain 2d8 + spellcasting modifier hit points each.",
      color: "#22c55e"
    },
    // Level 3
    {
      name: "Greater Heal",
      level: 3,
      school: "Healing",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (major healing incantation)", "S (powerful laying on hands)", "M (diamond dust worth 100 gp)"],
      duration: "Instantaneous",
      description: "Restores 4d8 + spellcasting modifier hit points and removes one disease or poison.",
      color: "#22c55e"
    }
  ],

  illusion: [
    // Cantrips
    {
      name: "Minor Illusion",
      level: 0,
      school: "Illusion",
      castingTime: "1 action",
      range: "30 feet",
      components: ["S (image-forming gesture)", "M (bit of fleece)"],
      duration: "5 rounds",
      description: "Creates a sound or image no larger than a 5-foot cube. Can distract or deceive.",
      color: "#8b5cf6"
    },
    // Level 1
    {
      name: "Disguise Self",
      level: 1,
      school: "Illusion",
      castingTime: "1 action",
      range: "Self",
      components: ["V (transformation word)", "S (self-shaping gestures)"],
      duration: "10 rounds",
      description: "Change your appearance including clothing, armor, weapons, and other equipment.",
      color: "#8b5cf6"
    },
    {
      name: "Invisibility",
      level: 1,
      school: "Illusion",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (vanishing word)", "S (fading gesture)", "M (eyelash in gum arabic)"],
      duration: "10 rounds",
      description: "Target becomes invisible until they attack, cast a spell, or duration ends.",
      color: "#8b5cf6"
    }
  ],

  necromancy: [
    // Cantrips
    {
      name: "Chill Touch",
      level: 0,
      school: "Necromancy",
      castingTime: "1 action",
      range: "120 feet",
      components: ["V (death whisper)", "S (grasping motion)"],
      duration: "1 round",
      description: "Spectral hand deals 1d8 necrotic damage and prevents healing until your next turn.",
      color: "#6b7280"
    },
    // Level 1
    {
      name: "Speak with Dead",
      level: 1,
      school: "Necromancy",
      castingTime: "3 actions",
      range: "10 feet",
      components: ["V (death's language)", "S (beckoning gesture)", "M (burning incense)"],
      duration: "5 rounds",
      description: "Ask up to 5 questions of a corpse that died within the last week.",
      color: "#6b7280"
    },
    {
      name: "Vampiric Touch",
      level: 1,
      school: "Necromancy",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (draining word)", "S (life-stealing touch)"],
      duration: "Instantaneous",
      description: "Deal 2d6 necrotic damage and regain half as hit points.",
      color: "#6b7280"
    }
  ],

  transmutation: [
    // Cantrips
    {
      name: "Mending",
      level: 0,
      school: "Transmutation",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (repair word)", "S (mending gesture)", "M (two lodestones)"],
      duration: "Instantaneous",
      description: "Repairs a single break or tear in an object no larger than 1 foot.",
      color: "#06b6d4"
    },
    // Level 1
    {
      name: "Alter Self",
      level: 1,
      school: "Transmutation",
      castingTime: "1 action",
      range: "Self",
      components: ["V (change word)", "S (self-altering gestures)"],
      duration: "10 rounds",
      description: "Change your physical form: grow claws (+1d4 damage), gills (breathe water), or camouflage (+5 stealth).",
      color: "#06b6d4"
    },
    {
      name: "Enhance Ability",
      level: 1,
      school: "Transmutation",
      castingTime: "1 action",
      range: "Touch",
      components: ["V (empowering word)", "S (enhancing touch)", "M (hair or fur from a beast)"],
      duration: "10 rounds",
      description: "Target gains advantage on one type of ability check and +2 to that ability score.",
      color: "#06b6d4"
    }
  ]
};

// Get all premade spells
export const getAllPremadeSpells = (): GeneratedSpell[] => {
  return Object.values(PREMADE_SPELLS).flat();
};

// Get premade spells by school
export const getPremadeSpellsBySchool = (school: string): GeneratedSpell[] => {
  return PREMADE_SPELLS[school.toLowerCase()] || [];
};

// Get premade spells by level
export const getPremadeSpellsByLevel = (level: number): GeneratedSpell[] => {
  return getAllPremadeSpells().filter(spell => spell.level === level);
};

// Get premade spells by school and level
export const getPremadeSpellsBySchoolAndLevel = (school: string, level: number): GeneratedSpell[] => {
  return getPremadeSpellsBySchool(school).filter(spell => spell.level === level);
};
