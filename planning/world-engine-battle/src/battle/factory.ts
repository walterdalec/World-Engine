import type { BattleState, BattleContext, Unit, Commander, Stats } from "./types";
import { generateBattlefield } from "./generate";

/** Create a basic statline from higher-level character sheet */
export function statsFromCharacter(char: any): Stats {
  const base: Stats = {
    hp: 20 + (char?.level ?? 1)*3, maxHp: 20 + (char?.level ?? 1)*3,
    atk: 6 + (char?.str ?? 2), def: 4 + (char?.con ?? 2),
    mag: 6 + (char?.int ?? 2), res: 4 + (char?.spr ?? 2),
    spd: 6 + (char?.dex ?? 2), rng: (char?.archetype?.toLowerCase().includes("ranger")?5:1),
    move: 4, morale: 60
  };
  return base;
}

export function skillsForArchetype(arch: string): string[] {
  const c = arch.toLowerCase();
  if (c.includes("mage")||c.includes("element")) return ["fireball","heal"];
  if (c.includes("ranger")) return ["basic_shot"];
  if (c.includes("cleric")||c.includes("paladin")) return ["heal","basic_slash"];
  if (c.includes("rogue")||c.includes("shadow")) return ["basic_slash"];
  return ["basic_slash"];
}

/** Build a BattleState from commander + party + enemies */
export function buildBattle(
  ctx: BattleContext,
  commanderChar: any,
  party: any[],   // array of character DTOs (mercenaries)
  enemies: any[]  // array of enemy DTOs
): BattleState {
  const { grid, friendly, enemy } = generateBattlefield(ctx, 20, 14);

  // Commander (off-field hero)
  const commanderUnit: Unit = {
    id: `commander:${commanderChar.id || commanderChar.name}`,
    name: commanderChar.name || "Hero",
    kind: "HeroCommander",
    faction: "Player",
    race: commanderChar.race || "Human",
    archetype: commanderChar.archetype || "Hero",
    level: commanderChar.level || 1,
    gear: { gearScore: commanderChar.gearScore || 0 },
    isCommander: true,
    stats: { hp: 1, maxHp: 1, atk:0, def:0, mag:0, res:0, spd: 99, rng: 0, move: 0, morale: 100 },
    statuses: [],
    skills: [],
  };

  const commander: Commander = {
    unitId: commanderUnit.id,
    aura: { name: "Heroic Presence", stats: { spd: +1, def: +1 } },
    abilities: [
      { id:"rally", name:"Rally", type:"command", apCost:0, range:0, shape:"ally", cooldown:3, charges:2, commanderOnly:true },
      { id:"meteor_strike", name:"Meteor Strike", type:"command", apCost:0, range:8, shape:"blast2", aoeRadius:2, cooldown:5, charges:1, commanderOnly:true }
    ],
    runtime: { rally:{ id:"rally", remainingCooldown:0, remainingCharges:2 }, meteor_strike:{ id:"meteor_strike", remainingCooldown:0, remainingCharges:1 } }
  };

  // Party units
  const units: Unit[] = [commanderUnit];
  party.forEach((c, i) => {
    units.push({
      id: `ally:${i}:${c.id || c.name}`,
      name: c.name || `Merc ${i+1}`,
      kind: "Mercenary",
      faction: "Player",
      race: c.race || "Human",
      archetype: c.archetype || "Warrior",
      level: c.level || 1,
      gear: { gearScore: c.gearScore || 0 },
      pos: { x: friendly.tiles[Math.min(i, friendly.tiles.length-1)].x, y: friendly.tiles[Math.min(i, friendly.tiles.length-1)].y },
      stats: statsFromCharacter(c),
      statuses: [],
      skills: skillsForArchetype(c.archetype || ""),
    });
  });

  // Enemy units
  enemies.forEach((e, i) => {
    units.push({
      id: `enemy:${i}:${e.id || e.name}`,
      name: e.name || `Enemy ${i+1}`,
      kind: e.kind || "Monster",
      faction: "Enemy",
      race: e.race || "Beast",
      archetype: e.archetype || "Raider",
      level: e.level || 1,
      gear: { gearScore: e.gearScore || 0 },
      pos: { x: enemy.tiles[Math.min(i, enemy.tiles.length-1)].x, y: enemy.tiles[Math.min(i, enemy.tiles.length-1)].y },
      stats: statsFromCharacter(e),
      statuses: [],
      skills: ["basic_slash"],
    });
  });

  const state: BattleState = {
    id: `battle:${Date.now()}`,
    turn: 0,
    phase: "Setup",
    grid,
    context: ctx,
    commander,
    units,
    initiative: [],
    friendlyDeployment: friendly,
    enemyDeployment: enemy,
    log: []
  };

  return state;
}
