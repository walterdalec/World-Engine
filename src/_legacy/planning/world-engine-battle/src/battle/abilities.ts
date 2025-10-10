import type { Ability, StatusEffect } from "./types";

const burn: StatusEffect = { id: "burn", name: "Burning", duration: 2, tags:["dot"] };

export const ABILITIES: Record<string, Ability> = {
  // Basic
  "basic_slash": { id:"basic_slash", name:"Slash", type:"skill", apCost:1, range:1, damage:{ amount: 8, type:"physical" }, shape:"enemy", requiresLOS:true },
  "basic_shot": { id:"basic_shot", name:"Bow Shot", type:"skill", apCost:1, range:5, damage:{ amount: 7, type:"physical" }, shape:"enemy", requiresLOS:true, tags:["ranged"] },
  // Spells
  "fireball": { id:"fireball", name:"Fireball", type:"spell", apCost:1, range:6, damage:{ amount: 12, type:"fire" }, shape:"blast1", aoeRadius:1, cooldown:2, requiresLOS:true, friendlyFire:true, statusApply:[burn] },
  "heal": { id:"heal", name:"Heal", type:"spell", apCost:1, range:4, healing: 10, shape:"ally", cooldown:1 },
  "entangle": { id:"entangle", name:"Entangle", type:"spell", apCost:1, range:5, shape:"enemy", cooldown:2, statusApply:[{ id:"root", name:"Rooted", duration:2, tags:["root"] }] },
  // Commander abilities
  "rally": { id:"rally", name:"Rally", type:"command", apCost:0, range:0, shape:"ally", cooldown:3, charges:2, commanderOnly:true, statusApply:[{ id:"rally", name:"Rallied", duration:2, modifiers:{ spd: +2 }, tags:["buff"] }] },
  "meteor_strike": { id:"meteor_strike", name:"Meteor Strike", type:"command", apCost:0, range:8, shape:"blast2", aoeRadius:2, cooldown:5, charges:1, commanderOnly:true, damage:{ amount: 20, type:"fire" }, requiresLOS:false, friendlyFire:true },
};
